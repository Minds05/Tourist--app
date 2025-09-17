"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Progress from "react-native-progress"

const { width } = Dimensions.get("window")

interface HomeDashboardProps {
  user: any
}

export function HomeDashboard({ user }: HomeDashboardProps) {
  const [safetyScore, setSafetyScore] = useState(85)
  const [weather, setWeather] = useState({ temp: 24, condition: "Partly Cloudy" })
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [isDeviceConnected, setIsDeviceConnected] = useState(false)
  const [currentView, setCurrentView] = useState("home")

  const connectHealthDevice = () => {
    setIsDeviceConnected(true)
    const interval = setInterval(() => {
      setHeartRate(Math.floor(Math.random() * (100 - 60) + 60))
    }, 2000)

    return () => clearInterval(interval)
  }

  const disconnectHealthDevice = () => {
    setIsDeviceConnected(false)
    setHeartRate(null)
  }

  const getSafetyColor = () => {
    if (safetyScore > 80) return "#10B981"
    if (safetyScore > 60) return "#F59E0B"
    return "#EF4444"
  }

  const getSafetyText = () => {
    if (safetyScore > 80) return "Safe"
    if (safetyScore > 60) return "Moderate"
    return "High Risk"
  }

  const ProfileBubble = () => (
    <TouchableOpacity style={styles.profileBubble}>
      <View style={styles.profileCircle}>
        <Text style={styles.profileInitial}>{user?.fullName?.charAt(0) || "U"}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ProfileBubble />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {user?.fullName}</Text>
          <Text style={styles.subtitleText}>Stay safe during your journey</Text>
        </View>

        {/* Safety Score Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Safety Score</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>{safetyScore}/100</Text>
              <View style={[styles.badge, { backgroundColor: getSafetyColor() }]}>
                <Text style={styles.badgeText}>{getSafetyText()}</Text>
              </View>
            </View>
            <Progress.Bar
              progress={safetyScore / 100}
              width={width - 80}
              height={8}
              color={getSafetyColor()}
              unfilledColor="#E5E7EB"
              borderWidth={0}
              style={styles.progressBar}
            />
            <Text style={styles.cardDescription}>Current location safety assessment based on real-time data</Text>
          </View>
        </View>

        {/* Weather Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Weather & Climate</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.weatherRow}>
              <View style={styles.weatherLeft}>
                <Text style={styles.temperatureText}>{weather.temp}°C</Text>
                <Text style={styles.conditionText}>{weather.condition}</Text>
              </View>
              <View style={styles.weatherRight}>
                <Text style={styles.weatherDetail}>Humidity: 65%</Text>
                <Text style={styles.weatherDetail}>Wind: 12 km/h</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Monitor Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Health Monitor</Text>
          </View>
          <View style={styles.cardContent}>
            {!isDeviceConnected ? (
              <View style={styles.healthDisconnected}>
                <Text style={styles.cardDescription}>Connect your health monitoring band to track vital signs</Text>
                <TouchableOpacity style={styles.connectButton} onPress={connectHealthDevice}>
                  <Text style={styles.connectButtonText}>Connect Device</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.healthConnected}>
                <View style={styles.heartRateRow}>
                  <Text style={styles.heartRateLabel}>Heart Rate</Text>
                  <Text style={styles.heartRateValue}>{heartRate ? `${heartRate} BPM` : "--"}</Text>
                </View>
                <View style={styles.deviceStatus}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Device Connected</Text>
                </View>
                <TouchableOpacity style={styles.disconnectButton} onPress={disconnectHealthDevice}>
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Activity Log Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pulse" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Activity Log</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Registered for tourist protection</Text>
              <Text style={styles.activityTime}>Today</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>KYC verification completed</Text>
              <Text style={styles.activityTime}>Today</Text>
            </View>
            <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.activityText}>Location services enabled</Text>
              <Text style={styles.activityTime}>Today</Text>
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
  profileBubble: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 50,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  cardContent: {
    flex: 1,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  progressBar: {
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  weatherRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weatherLeft: {
    flex: 1,
  },
  temperatureText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  conditionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  weatherRight: {
    alignItems: "flex-end",
  },
  weatherDetail: {
    fontSize: 12,
    color: "#6B7280",
  },
  healthDisconnected: {
    alignItems: "center",
  },
  connectButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    width: "100%",
  },
  connectButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  healthConnected: {
    gap: 12,
  },
  heartRateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heartRateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  heartRateValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366F1",
  },
  deviceStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
  },
  disconnectButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disconnectButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  activityText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
  },
})
