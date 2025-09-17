"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import * as Camera from "expo-camera"
import * as MediaLibrary from "expo-media-library"
import * as Contacts from "expo-contacts"
import * as Notifications from "expo-notifications"

interface Permission {
  name: string
  icon: keyof typeof Ionicons.glyphMap
  description: string
  status: "granted" | "denied" | "undetermined"
  required: boolean
}

interface PermissionsManagerProps {
  onPermissionsGranted: () => void
}

export function PermissionsManager({ onPermissionsGranted }: PermissionsManagerProps) {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      name: "Location",
      icon: "location",
      description: "Required for safety alerts and emergency services",
      status: "undetermined",
      required: true,
    },
    {
      name: "Camera",
      icon: "camera",
      description: "For profile pictures and incident reporting",
      status: "undetermined",
      required: false,
    },
    {
      name: "Photo Library",
      icon: "images",
      description: "To select photos for profile and reports",
      status: "undetermined",
      required: false,
    },
    {
      name: "Contacts",
      icon: "people",
      description: "To set up emergency contacts",
      status: "undetermined",
      required: false,
    },
    {
      name: "Notifications",
      icon: "notifications",
      description: "For safety alerts and emergency notifications",
      status: "undetermined",
      required: true,
    },
  ])

  useEffect(() => {
    checkAllPermissions()
  }, [])

  const checkAllPermissions = async () => {
    const updatedPermissions = [...permissions]

    try {
      // Check Location permission
      const locationStatus = await Location.getForegroundPermissionsAsync()
      updatedPermissions[0].status = locationStatus.granted ? "granted" : "denied"

      // Check Camera permission
      const cameraStatus = await Camera.getCameraPermissionsAsync()
      updatedPermissions[1].status = cameraStatus.granted ? "granted" : "denied"

      // Check Media Library permission
      const mediaStatus = await MediaLibrary.getPermissionsAsync()
      updatedPermissions[2].status = mediaStatus.granted ? "granted" : "denied"

      // Check Contacts permission
      const contactsStatus = await Contacts.getPermissionsAsync()
      updatedPermissions[3].status = contactsStatus.granted ? "granted" : "denied"

      // Check Notifications permission
      const notificationStatus = await Notifications.getPermissionsAsync()
      updatedPermissions[4].status = notificationStatus.granted ? "granted" : "denied"

      setPermissions(updatedPermissions)

      // Check if all required permissions are granted
      const requiredPermissions = updatedPermissions.filter((p) => p.required)
      const allRequiredGranted = requiredPermissions.every((p) => p.status === "granted")

      if (allRequiredGranted) {
        onPermissionsGranted()
      }
    } catch (error) {
      console.error("Error checking permissions:", error)
    }
  }

  const requestPermission = async (permissionName: string) => {
    try {
      let result
      switch (permissionName) {
        case "Location":
          result = await Location.requestForegroundPermissionsAsync()
          break
        case "Camera":
          result = await Camera.requestCameraPermissionsAsync()
          break
        case "Photo Library":
          result = await MediaLibrary.requestPermissionsAsync()
          break
        case "Contacts":
          result = await Contacts.requestPermissionsAsync()
          break
        case "Notifications":
          result = await Notifications.requestPermissionsAsync()
          break
        default:
          return
      }

      if (result?.granted) {
        setPermissions((prev) => prev.map((p) => (p.name === permissionName ? { ...p, status: "granted" } : p)))
      } else {
        setPermissions((prev) => prev.map((p) => (p.name === permissionName ? { ...p, status: "denied" } : p)))

        Alert.alert(
          "Permission Denied",
          `${permissionName} permission is required for the app to function properly. Please enable it in your device settings.`,
          [{ text: "OK" }],
        )
      }

      // Recheck all permissions
      await checkAllPermissions()
    } catch (error) {
      console.error(`Error requesting ${permissionName} permission:`, error)
    }
  }

  const requestAllPermissions = async () => {
    for (const permission of permissions) {
      if (permission.status !== "granted") {
        await requestPermission(permission.name)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "granted":
        return "#10B981"
      case "denied":
        return "#EF4444"
      default:
        return "#F59E0B"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "granted":
        return "checkmark-circle"
      case "denied":
        return "close-circle"
      default:
        return "help-circle"
    }
  }

  const allRequiredGranted = permissions.filter((p) => p.required).every((p) => p.status === "granted")

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={48} color="#6366F1" />
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            Tourist Safety App needs these permissions to provide you with the best safety features and emergency
            services.
          </Text>
        </View>

        <View style={styles.permissionsList}>
          {permissions.map((permission, index) => (
            <View key={index} style={styles.permissionItem}>
              <View style={styles.permissionLeft}>
                <Ionicons name={permission.icon} size={24} color="#6366F1" />
                <View style={styles.permissionInfo}>
                  <View style={styles.permissionHeader}>
                    <Text style={styles.permissionName}>{permission.name}</Text>
                    {permission.required && <Text style={styles.requiredBadge}>Required</Text>}
                  </View>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                </View>
              </View>
              <View style={styles.permissionRight}>
                <Ionicons
                  name={getStatusIcon(permission.status) as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={getStatusColor(permission.status)}
                />
                {permission.status !== "granted" && (
                  <TouchableOpacity style={styles.grantButton} onPress={() => requestPermission(permission.name)}>
                    <Text style={styles.grantButtonText}>Grant</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.grantAllButton} onPress={requestAllPermissions}>
            <Text style={styles.grantAllButtonText}>Grant All Permissions</Text>
          </TouchableOpacity>

          {allRequiredGranted && (
            <TouchableOpacity style={styles.continueButton} onPress={onPermissionsGranted}>
              <Text style={styles.continueButtonText}>Continue to App</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy is important to us. These permissions are only used to provide safety features and will never
            be shared with third parties.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  permissionsList: {
    flex: 1,
    gap: 16,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  permissionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  permissionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  permissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  permissionDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  permissionRight: {
    alignItems: "center",
    gap: 8,
  },
  grantButton: {
    backgroundColor: "#6366F1",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  grantButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  grantAllButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  grantAllButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
})
