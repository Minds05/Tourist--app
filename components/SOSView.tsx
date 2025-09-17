"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Linking,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"

const { width } = Dimensions.get("window")

interface SOSViewProps {
  user: any
}

export function SOSView({ user }: SOSViewProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [emergencyType, setEmergencyType] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
        // Vibrate every second during countdown
        Vibration.vibrate(100)
      }, 1000)
    } else if (countdown === 0 && isEmergencyActive) {
      sendEmergencyAlert()
    }

    return () => clearInterval(interval)
  }, [countdown, isEmergencyActive])

  const sendEmergencyAlert = async () => {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation(location)

      // In a real app, this would send alerts to authorities and emergency contacts
      console.log("Emergency alert sent!")

      // Continuous vibration pattern for emergency
      Vibration.vibrate([1000, 500, 1000, 500], true)

      Alert.alert(
        "Emergency Alert Sent",
        "Authorities and emergency contacts have been notified of your location and situation.",
        [{ text: "OK" }],
      )
    } catch (error) {
      console.error("Error sending emergency alert:", error)
    }
  }

  const activateEmergency = (type: string) => {
    setEmergencyType(type)
    setShowConfirmation(true)
    // Short vibration for button press
    Vibration.vibrate(50)
  }

  const confirmEmergency = () => {
    setIsEmergencyActive(true)
    setCountdown(10)
    setShowConfirmation(false)
    // Strong vibration for confirmation
    Vibration.vibrate(200)
  }

  const cancelEmergency = () => {
    setIsEmergencyActive(false)
    setCountdown(0)
    setEmergencyType(null)
    setShowConfirmation(false)
    Vibration.cancel()
  }

  const makeEmergencyCall = (number: string) => {
    Vibration.vibrate(50)
    Linking.openURL(`tel:${number}`)
  }

  if (showConfirmation) {
    return (
      <SafeAreaView style={[styles.container, styles.emergencyBackground]}>
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={styles.confirmationTitle}>Confirm Emergency</Text>
              <Text style={styles.confirmationSubtitle}>Are you sure you want to activate the emergency alert?</Text>
            </View>
            <View style={styles.confirmationContent}>
              <View style={styles.emergencyTypeContainer}>
                <Text style={styles.emergencyTypeLabel}>Emergency Type: {emergencyType}</Text>
                <Text style={styles.emergencyTypeDescription}>
                  This will immediately alert local authorities and your emergency contacts.
                </Text>
              </View>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEmergency}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={confirmEmergency}>
                  <Text style={styles.confirmButtonText}>Confirm Emergency</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (isEmergencyActive) {
    return (
      <SafeAreaView style={[styles.container, styles.emergencyBackground]}>
        <View style={styles.activeEmergencyContainer}>
          <View style={styles.activeEmergencyCard}>
            <View style={styles.activeEmergencyHeader}>
              <View style={styles.pulsingIcon}>
                <Ionicons name="warning" size={32} color="#ffffff" />
              </View>
              <Text style={styles.activeEmergencyTitle}>EMERGENCY ACTIVE</Text>
              <Text style={styles.activeEmergencySubtitle}>
                {countdown > 0 ? `Alert will be sent in ${countdown} seconds` : "Emergency alert has been sent!"}
              </Text>
            </View>
            <View style={styles.activeEmergencyContent}>
              <View style={styles.alertContainer}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.alertText}>
                  {countdown > 0
                    ? "You can still cancel this emergency alert"
                    : "Authorities and emergency contacts have been notified"}
                </Text>
              </View>

              <View style={styles.emergencyInfoContainer}>
                <View style={styles.emergencyInfoItem}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <View style={styles.emergencyInfoText}>
                    <Text style={styles.emergencyInfoLabel}>Location Shared</Text>
                    <Text style={styles.emergencyInfoValue}>Shillong, Meghalaya</Text>
                  </View>
                </View>
                <View style={styles.emergencyInfoItem}>
                  <Ionicons name="call" size={16} color="#6B7280" />
                  <View style={styles.emergencyInfoText}>
                    <Text style={styles.emergencyInfoLabel}>Emergency Contact</Text>
                    <Text style={styles.emergencyInfoValue}>{user?.emergencyContact}</Text>
                  </View>
                </View>
                <View style={styles.emergencyInfoItem}>
                  <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
                  <View style={styles.emergencyInfoText}>
                    <Text style={styles.emergencyInfoLabel}>Tourist ID</Text>
                    <Text style={styles.emergencyInfoValue}>{user?.uniqueId}</Text>
                  </View>
                </View>
              </View>

              {countdown > 0 && (
                <TouchableOpacity style={styles.cancelEmergencyButton} onPress={cancelEmergency}>
                  <Ionicons name="close" size={16} color="#374151" />
                  <Text style={styles.cancelEmergencyButtonText}>Cancel Emergency</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.subtitle}>Quick access to emergency services</Text>
        </View>

        {/* Emergency Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Emergency Status</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>System Active</Text>
                <Text style={styles.statusDescription}>Ready to send emergency alerts</Text>
              </View>
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineBadgeText}>Online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Buttons */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Emergency Types</Text>
            <Text style={styles.cardDescription}>Select the type of emergency you're experiencing</Text>
          </View>
          <View style={styles.cardContent}>
            <TouchableOpacity style={styles.emergencyButton} onPress={() => activateEmergency("Medical Emergency")}>
              <Ionicons name="medical" size={20} color="#ffffff" />
              <Text style={styles.emergencyButtonText}>Medical Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyButton} onPress={() => activateEmergency("Security Threat")}>
              <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
              <Text style={styles.emergencyButtonText}>Security Threat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyButton} onPress={() => activateEmergency("Lost/Stranded")}>
              <Ionicons name="location" size={20} color="#ffffff" />
              <Text style={styles.emergencyButtonText}>Lost/Stranded</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyButton} onPress={() => activateEmergency("General Emergency")}>
              <Ionicons name="call" size={20} color="#ffffff" />
              <Text style={styles.emergencyButtonText}>General Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
            <Text style={styles.cardDescription}>Quick dial emergency numbers</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.contactsGrid}>
              <TouchableOpacity style={styles.contactButton} onPress={() => makeEmergencyCall("100")}>
                <Ionicons name="call" size={20} color="#6366F1" />
                <Text style={styles.contactButtonTitle}>Police</Text>
                <Text style={styles.contactButtonNumber}>100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={() => makeEmergencyCall("108")}>
                <Ionicons name="call" size={20} color="#6366F1" />
                <Text style={styles.contactButtonTitle}>Ambulance</Text>
                <Text style={styles.contactButtonNumber}>108</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={() => makeEmergencyCall("101")}>
                <Ionicons name="call" size={20} color="#6366F1" />
                <Text style={styles.contactButtonTitle}>Fire</Text>
                <Text style={styles.contactButtonNumber}>101</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={() => makeEmergencyCall("1363")}>
                <Ionicons name="call" size={20} color="#6366F1" />
                <Text style={styles.contactButtonTitle}>Tourist Helpline</Text>
                <Text style={styles.contactButtonNumber}>1363</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Personal Emergency Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Emergency Information</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <Text style={styles.infoValue}>{user?.bloodGroup}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Emergency Contact</Text>
              <Text style={styles.infoValue}>{user?.emergencyContact}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Tourist ID</Text>
              <Text style={styles.infoValue}>{user?.uniqueId}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  emergencyBackground: {
    backgroundColor: "#EF4444",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    marginLeft: 28,
  },
  cardContent: {
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  statusDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  onlineBadge: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  onlineBadgeText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "600",
  },
  emergencyButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emergencyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  contactsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contactButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  contactButtonTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    marginTop: 4,
  },
  contactButtonNumber: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
  },
  infoValue: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  confirmationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  confirmationHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#EF4444",
    marginTop: 12,
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  confirmationContent: {
    gap: 16,
  },
  emergencyTypeContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  emergencyTypeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  emergencyTypeDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  activeEmergencyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  activeEmergencyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  activeEmergencyHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  pulsingIcon: {
    width: 64,
    height: 64,
    backgroundColor: "#EF4444",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  activeEmergencyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#EF4444",
  },
  activeEmergencySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  activeEmergencyContent: {
    gap: 16,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  alertText: {
    fontSize: 12,
    color: "#DC2626",
    marginLeft: 8,
    flex: 1,
  },
  emergencyInfoContainer: {
    gap: 8,
  },
  emergencyInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 8,
  },
  emergencyInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  emergencyInfoLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
  },
  emergencyInfoValue: {
    fontSize: 12,
    color: "#6B7280",
  },
  cancelEmergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
  },
  cancelEmergencyButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
})
