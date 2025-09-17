"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Navigation, Hospital, Shield, AlertTriangle, Route, ZoomIn, ZoomOut, Locate } from "lucide-react"

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  type: "hospital" | "police" | "safe-zone" | "risk-zone"
  distance: number
}

export function MapsView() {
  const [currentLocation, setCurrentLocation] = useState({ lat: 25.5788, lng: 91.8933 }) // Shillong coordinates
  const [nearbyLocations, setNearbyLocations] = useState<Location[]>([])
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low")
  const [showWarning, setShowWarning] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mapZoom, setMapZoom] = useState(13)
  const [mapCenter, setMapCenter] = useState({ lat: 25.5788, lng: 91.8933 })

  useEffect(() => {
    // Simulate nearby locations
    const locations: Location[] = [
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

    // Check for nearby risk zones
    const nearbyRisk = locations.find((loc) => loc.type === "risk-zone" && loc.distance < 0.05) // 50 meters
    if (nearbyRisk) {
      setRiskLevel("high")
      setShowWarning(true)
    } else {
      const mediumRisk = locations.find((loc) => loc.type === "risk-zone" && loc.distance < 0.5) // 500 meters
      if (mediumRisk) {
        setRiskLevel("medium")
      }
    }
  }, [])

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return <Hospital className="w-4 h-4 text-red-500" />
      case "police":
        return <Shield className="w-4 h-4 text-blue-500" />
      case "safe-zone":
        return <Shield className="w-4 h-4 text-green-500" />
      case "risk-zone":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getLocationColor = (type: string) => {
    switch (type) {
      case "hospital":
        return "bg-red-100 border-red-300"
      case "police":
        return "bg-blue-100 border-blue-300"
      case "safe-zone":
        return "bg-green-100 border-green-300"
      case "risk-zone":
        return "bg-red-100 border-red-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  const navigateToLocation = (location: Location) => {
    setSelectedLocation(location)
    // In a real app, this would integrate with maps navigation
    alert(`Navigation started to ${location.name}`)
  }

  const zoomIn = () => setMapZoom(Math.min(mapZoom + 1, 18))
  const zoomOut = () => setMapZoom(Math.max(mapZoom - 1, 8))
  const centerOnUser = () => setMapCenter(currentLocation)
  const selectLocationOnMap = (location: Location) => {
    setSelectedLocation(location)
    setMapCenter({ lat: location.lat, lng: location.lng })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-3 py-4 space-y-4 max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-lg font-bold text-foreground">Safety Maps</h1>
          <p className="text-sm text-muted-foreground">Real-time safety zones and nearby services</p>
        </div>

        {/* Risk Warning */}
        {showWarning && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <AlertDescription className="text-destructive text-xs leading-relaxed">
              Warning: You are within 50 meters of a high-risk zone. Please exercise caution and consider moving to a
              safer area.
            </AlertDescription>
          </Alert>
        )}

        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="truncate">Interactive Map</span>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={zoomOut}
                  className="h-6 w-6 p-0 rounded-full bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-white/90"
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={zoomIn}
                  className="h-6 w-6 p-0 rounded-full bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-white/90"
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={centerOnUser}
                  className="h-6 w-6 p-0 rounded-full bg-primary/10 backdrop-blur-sm border shadow-sm hover:bg-primary/20"
                >
                  <Locate className="w-3 h-3 text-primary" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative bg-slate-100 rounded-xl h-48 overflow-hidden border-2 shadow-inner w-full">
              {/* Map Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                {/* Grid lines to simulate map */}
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`h-${i}`} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 16.67}%` }} />
                  ))}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`v-${i}`} className="absolute h-full w-px bg-gray-400" style={{ left: `${i * 12.5}%` }} />
                  ))}
                </div>

                {/* Current Location Marker */}
                <div
                  className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1.5 -translate-y-1.5 animate-pulse"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                >
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                </div>

                {/* Location Markers */}
                {nearbyLocations.map((location, index) => (
                  <div
                    key={location.id}
                    className={`absolute w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-2.5 -translate-y-2.5 flex items-center justify-center text-white text-xs font-bold ${
                      location.type === "hospital"
                        ? "bg-red-500"
                        : location.type === "police"
                          ? "bg-blue-600"
                          : location.type === "safe-zone"
                            ? "bg-green-500"
                            : "bg-red-600"
                    } ${selectedLocation?.id === location.id ? "ring-2 ring-yellow-400" : ""}`}
                    style={{
                      left: `${45 + index * 12}%`,
                      top: `${30 + index * 8}%`,
                    }}
                    onClick={() => selectLocationOnMap(location)}
                  >
                    {location.type === "hospital"
                      ? "H"
                      : location.type === "police"
                        ? "P"
                        : location.type === "safe-zone"
                          ? "S"
                          : "!"}
                  </div>
                ))}

                {/* Heat Zones */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-red-500 opacity-30 rounded-full"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-green-500 opacity-30 rounded-full"></div>
                <div className="absolute top-1/3 left-1/4 w-10 h-10 bg-yellow-500 opacity-30 rounded-full"></div>
              </div>

              {/* Map Info Overlay */}
              <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 text-xs shadow-sm border">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Zoom: {mapZoom}</span>
                </div>
              </div>
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="mt-3 p-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getLocationIcon(selectedLocation.type)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs truncate">{selectedLocation.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedLocation.distance} km away</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigateToLocation(selectedLocation)}
                    className="rounded-full px-2 shadow-sm text-xs h-7 flex-shrink-0"
                  >
                    <Route className="w-3 h-3 mr-1" />
                    Go
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Location Status */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">Current Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">Shillong, Meghalaya</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
              </div>
              <Badge
                variant={riskLevel === "low" ? "default" : riskLevel === "medium" ? "secondary" : "destructive"}
                className={
                  riskLevel === "low"
                    ? "bg-green-100 text-green-800 border-green-300 text-xs flex-shrink-0"
                    : riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300 text-xs flex-shrink-0"
                      : "text-xs flex-shrink-0"
                }
              >
                {riskLevel === "low" ? "Safe Zone" : riskLevel === "medium" ? "Moderate Risk" : "High Risk"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Heat Map Legend */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Safety Heat Map Legend</CardTitle>
            <CardDescription className="text-xs">Color-coded safety zones in your area</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded flex-shrink-0"></div>
                  <span className="text-xs truncate">Safe Zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded flex-shrink-0"></div>
                  <span className="text-xs truncate">Moderate Risk</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded flex-shrink-0"></div>
                  <span className="text-xs truncate">High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded flex-shrink-0"></div>
                  <span className="text-xs truncate">Services</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nearby Services */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nearby Services</CardTitle>
            <CardDescription className="text-xs">Emergency services and safe locations</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {nearbyLocations.map((location) => (
                <div
                  key={location.id}
                  className={`p-2 rounded-xl border-2 ${getLocationColor(location.type)} cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]`}
                  onClick={() => selectLocationOnMap(location)}
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getLocationIcon(location.type)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{location.name}</p>
                        <p className="text-xs text-muted-foreground">{location.distance} km away</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full px-2 shadow-sm hover:shadow-md transition-shadow bg-transparent text-xs h-7 flex-shrink-0"
                    >
                      <Route className="w-3 h-3 mr-1" />
                      Go
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Quick Actions */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-auto py-2 flex flex-col gap-1 bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-150 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <Hospital className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">Find Hospital</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2 flex flex-col gap-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-150 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Find Police</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
