"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  SafeAreaView,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface ProfileViewProps {
  user: any
  onBack?: () => void
}

export function ProfileView({ user, onBack }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [locationAlerts, setLocationAlerts] = useState(true)
  const [emergencyNotifications, setEmergencyNotifications] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [editedUser, setEditedUser] = useState(user)
  const [activeTab, setActiveTab] = useState("profile")

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem("tourist-user", JSON.stringify(editedUser))
      setIsEditing(false)
      Alert.alert("Success", "Profile updated successfully")
    } catch (error) {
      Alert.alert("Error", "Failed to update profile")
    }
  }

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("tourist-user")
          await AsyncStorage.removeItem("tourist-registered")
          // Navigate to auth screen
        },
      },
    ])
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    // In a real app, this would update the theme
  }

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Profile Picture */}
      <View style={styles.card}>
        <View style={styles.profilePictureContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")}
            </Text>
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileId}>Tourist ID: {user?.uniqueId}</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>KYC Verified</Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="person" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => (isEditing ? handleSave() : setIsEditing(true))}>
            <Ionicons name={isEditing ? "checkmark" : "pencil"} size={14} color="#6366F1" />
            <Text style={styles.editButtonText}>{isEditing ? "Save" : "Edit"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedUser?.fullName || ""}
                onChangeText={(text) => setEditedUser({ ...editedUser, fullName: text })}
              />
            ) : (
              <View style={styles.inputDisplay}>
                <Text style={styles.inputDisplayText}>{user?.fullName}</Text>
              </View>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedUser?.email || ""}
                onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
                keyboardType="email-address"
              />
            ) : (
              <View style={styles.inputDisplay}>
                <Text style={styles.inputDisplayText}>{user?.email}</Text>
              </View>
            )}
          </View>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedUser?.phone || ""}
                  onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })}
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={styles.inputDisplay}>
                  <Text style={styles.inputDisplayText}>{user?.phone}</Text>
                </View>
              )}
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Nationality</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedUser?.nationality || ""}
                  onChangeText={(text) => setEditedUser({ ...editedUser, nationality: text })}
                />
              ) : (
                <View style={styles.inputDisplay}>
                  <Text style={styles.inputDisplayText}>{user?.nationality}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Emergency Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Emergency Information</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Blood Group</Text>
              <View style={styles.inputDisplay}>
                <Text style={styles.inputDisplayText}>{user?.bloodGroup}</Text>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Emergency Contact</Text>
              <View style={styles.inputDisplay}>
                <Text style={styles.inputDisplayText}>{user?.emergencyContact}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Theme Settings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Appearance</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Switch between light and dark themes</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="notifications" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Location Alerts</Text>
              <Text style={styles.settingDescription}>Get notified when staying in one location too long</Text>
            </View>
            <Switch value={locationAlerts} onValueChange={setLocationAlerts} />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Emergency Notifications</Text>
              <Text style={styles.settingDescription}>Receive emergency alerts and safety updates</Text>
            </View>
            <Switch value={emergencyNotifications} onValueChange={setEmergencyNotifications} />
          </View>
        </View>
      </View>

      {/* Language Settings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="language" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Language & Translation</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>App Language</Text>
            <View style={styles.inputDisplay}>
              <Text style={styles.inputDisplayText}>English</Text>
            </View>
          </View>
          <View style={styles.translationInfo}>
            <Text style={styles.translationTitle}>AI Translation</Text>
            <Text style={styles.translationDescription}>
              Speak or type in your native language and the AI will translate to the local language for better
              communication with locals.
            </Text>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="settings" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Account</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-checkmark" size={16} color="#6366F1" />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={16} color="#6366F1" />
            <Text style={styles.actionButtonText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out" size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "settings" && styles.activeTab]}
          onPress={() => setActiveTab("settings")}
        >
          <Text style={[styles.tabText, activeTab === "settings" && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "profile" ? renderProfileTab() : renderSettingsTab()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  headerSpacer: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#111827",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
  },
  cameraButton: {
    position: "absolute",
    bottom: 8,
    right: "35%",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  profileId: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "center",
    marginTop: 8,
  },
  verifiedBadgeText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    color: "#6366F1",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  cardContent: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputRow: {
    flexDirection: "row",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  textInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#111827",
  },
  inputDisplay: {
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputDisplayText: {
    fontSize: 12,
    color: "#111827",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  settingDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  translationInfo: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  translationTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  translationDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 8,
  },
  logoutButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  logoutButtonText: {
    color: "#EF4444",
  },
})
