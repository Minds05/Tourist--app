"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from "react-native"
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { Ionicons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

interface LocationData {
  id: string
  name: string
  lat: number
  lng: number
  type: "hospital" | "police" | "safe-zone" | "risk-zone"
  distance: number
}

export function MapsView() {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
  const [nearbyLocations, setNearbyLocations] = useState<LocationData[]>([])
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low")
  const [showWarning, setShowWarning] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [mapRegion, setMapRegion] = useState({
    latitude: 25.5788,
    longitude: 91.8933,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })

  useEffect(() => {
    requestLocationPermission()
    loadNearbyLocations()
  }, [])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required for safety features")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation(location)
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    } catch (error) {
      console.error("Error getting location:", error)
      Alert.alert("Location Error", "Unable to get your current location")
    }
  }

  const loadNearbyLocations = () => {
    const locations: LocationData[] = [
      {
        id: "1",
        name: "Civil Hospital Shillong",
        lat: 25.5788,
        lng: 91.8933,
        type: "hospital",
        distance: 0.5,
      },
      {
        id: "2",
        name: "Shillong Police Station",
        lat: 25.5744,
        lng: 91.8878,
        type: "police",
        distance: 0.8,
      },
      {
        id: "3",
        name: "Tourist Safe Zone - Police Bazaar",
        lat: 25.5744,
        lng: 91.8878,
        type: "safe-zone",
        distance: 1.2,
      },
      {
        id: "4",
        name: "High Risk Area - Avoid After Dark",
        lat: 25.5688,
        lng: 91.8833,
        type: "risk-zone",
        distance: 2.1,
      },
    ]

    setNearbyLocations(locations)

    const nearbyRisk = locations.find((loc) => loc.type === "risk-zone" && loc.distance < 0.05)
    if (nearbyRisk) {
      setRiskLevel("high")
      setShowWarning(true)
    } else {
      const mediumRisk = locations.find((loc) => loc.type === "risk-zone" && loc.distance < 0.5)
      if (mediumRisk) {
        setRiskLevel("medium")
      }
    }
  }

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "hospital":
        return "#EF4444"
      case "police":
        return "#3B82F6"
      case "safe-zone":
        return "#10B981"
      case "risk-zone":
        return "#DC2626"
      default:
        return "#6B7280"
    }
  }

  const navigateToLocation = (location: LocationData) => {
    setSelectedLocation(location)
    setMapRegion({
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    })
    Alert.alert("Navigation", `Navigation started to ${location.name}`)
  }

  const centerOnUser = () => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }

  const getRiskColor = () => {
    switch (riskLevel) {
      case "low":
        return "#10B981"
      case "medium":
        return "#F59E0B"
      case "high":
        return "#EF4444"
      default:
        return "#6B7280"
    }
  }

  const getRiskText = () => {
    switch (riskLevel) {
      case "low":
        return "Safe Zone"
      case "medium":
        return "Moderate Risk"
      case "high":
        return "High Risk"
      default:
        return "Unknown"
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Safety Maps</Text>
        <Text style={styles.subtitle}>Real-time safety zones and nearby services</Text>
      </View>

      {/* Risk Warning */}
      {showWarning && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color="#EF4444" />
          <Text style={styles.warningText}>
            Warning: You are within 50 meters of a high-risk zone. Please exercise caution.
          </Text>
        </View>
      )}

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Your Location"
              pinColor="#3B82F6"
            />
          )}

          {/* Nearby Location Markers */}
          {nearbyLocations.map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.lat,
                longitude: location.lng,
              }}
              title={location.name}
              description={`${location.distance} km away`}
              pinColor={getMarkerColor(location.type)}
              onPress={() => setSelectedLocation(location)}
            />
          ))}

          {/* Risk Zone Circles */}
          {nearbyLocations
            .filter((loc) => loc.type === "risk-zone")
            .map((location) => (
              <Circle
                key={`circle-${location.id}`}
                center={{
                  latitude: location.lat,
                  longitude: location.lng,
                }}
                radius={200}
                fillColor="rgba(239, 68, 68, 0.2)"
                strokeColor="rgba(239, 68, 68, 0.5)"
                strokeWidth={2}
              />
            ))}

          {/* Safe Zone Circles */}
          {nearbyLocations
            .filter((loc) => loc.type === "safe-zone")
            .map((location) => (
              <Circle
                key={`safe-circle-${location.id}`}
                center={{
                  latitude: location.lat,
                  longitude: location.lng,
                }}
                radius={300}
                fillColor="rgba(16, 185, 129, 0.2)"
                strokeColor="rgba(16, 185, 129, 0.5)"
                strokeWidth={2}
              />
            ))}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
            <Ionicons name="locate" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Location Info */}
      {selectedLocation && (
        <View style={styles.selectedLocationContainer}>
          <View style={styles.selectedLocationInfo}>
            <Ionicons
              name={
                selectedLocation.type === "hospital"
                  ? "medical"
                  : selectedLocation.type === "police"
                    ? "shield-checkmark"
                    : selectedLocation.type === "safe-zone"
                      ? "checkmark-circle"
                      : "warning"
              }
              size={20}
              color={getMarkerColor(selectedLocation.type)}
            />
            <View style={styles.selectedLocationText}>
              <Text style={styles.selectedLocationName}>{selectedLocation.name}</Text>
              <Text style={styles.selectedLocationDistance}>{selectedLocation.distance} km away</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.navigateButton} onPress={() => navigateToLocation(selectedLocation)}>
            <Ionicons name="navigate" size={16} color="#ffffff" />
            <Text style={styles.navigateButtonText}>Go</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Info Panel */}
      <ScrollView style={styles.bottomPanel} showsVerticalScrollIndicator={false}>
        {/* Current Location Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Current Location</Text>
          </View>
          <View style={styles.locationStatus}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Shillong, Meghalaya</Text>
              <Text style={styles.coordinates}>
                {currentLocation
                  ? `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`
                  : "Getting location..."}
              </Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor() }]}>
              <Text style={styles.riskBadgeText}>{getRiskText()}</Text>
            </View>
          </View>
        </View>

        {/* Nearby Services */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Nearby Services</Text>
          </View>
          {nearbyLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.serviceItem}
              onPress={() => setSelectedLocation(location)}
            >
              <Ionicons
                name={
                  location.type === "hospital"
                    ? "medical"
                    : location.type === "police"
                      ? "shield-checkmark"
                      : location.type === "safe-zone"
                        ? "checkmark-circle"
                        : "warning"
                }
                size={20}
                color={getMarkerColor(location.type)}
              />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{location.name}</Text>
                <Text style={styles.serviceDistance}>{location.distance} km away</Text>
              </View>
              <TouchableOpacity style={styles.serviceButton} onPress={() => navigateToLocation(location)}>
                <Ionicons name="navigate" size={14} color="#6366F1" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="medical" size={24} color="#EF4444" />
              <Text style={[styles.quickActionText, { color: "#DC2626" }]}>Find Hospital</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              <Text style={[styles.quickActionText, { color: "#2563EB" }]}>Find Police</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: "#DC2626",
    marginLeft: 8,
    flex: 1,
  },
  mapContainer: {
    height: height * 0.4,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  controlButton: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  selectedLocationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedLocationText: {
    marginLeft: 12,
    flex: 1,
  },
  selectedLocationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  selectedLocationDistance: {
    fontSize: 12,
    color: "#6B7280",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navigateButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  bottomPanel: {
    flex: 1,
    paddingHorizontal: 16,
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
  locationStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  coordinates: {
    fontSize: 12,
    color: "#6B7280",
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  serviceDistance: {
    fontSize: 12,
    color: "#6B7280",
  },
  serviceButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
})
