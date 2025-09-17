"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Cloud, Heart, Activity } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { MapsView } from "@/components/maps-view"
import { SOSView } from "@/components/sos-view"
import { TripsView } from "@/components/trips-view"
import { GroupsView } from "@/components/groups-view"
import { ProfileView } from "@/components/profile-view"
import { AIAssistant } from "@/components/ai-assistant"

interface HomeDashboardProps {
  user: any
}

export function HomeDashboard({ user }: HomeDashboardProps) {
  const [safetyScore, setSafetyScore] = useState(85)
  const [weather, setWeather] = useState({ temp: 24, condition: "Partly Cloudy" })
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [isDeviceConnected, setIsDeviceConnected] = useState(false)
  const [currentView, setCurrentView] = useState("home")
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  const connectHealthDevice = () => {
    setIsDeviceConnected(true)
    // Simulate heart rate monitoring
    const interval = setInterval(() => {
      setHeartRate(Math.floor(Math.random() * (100 - 60) + 60))
    }, 2000)

    return () => clearInterval(interval)
  }

  const disconnectHealthDevice = () => {
    setIsDeviceConnected(false)
    setHeartRate(null)
  }

  const ProfileBubble = () =>
    currentView === "home" ? (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("profile")}
          className="w-12 h-12 rounded-full p-0 bg-primary/10 hover:bg-primary/20 touch-manipulation"
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-xs">{user?.fullName?.charAt(0) || "U"}</span>
          </div>
        </Button>
      </div>
    ) : null

  if (currentView === "maps") {
    return (
      <div className="min-h-screen bg-background">
        <MapsView />
        <AIAssistant />
        <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    )
  }

  if (currentView === "sos") {
    return (
      <div className="min-h-screen bg-background">
        <SOSView user={user} />
        <AIAssistant />
        <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    )
  }

  if (currentView === "trips") {
    return (
      <div className="min-h-screen bg-background">
        <TripsView user={user} />
        <AIAssistant />
        <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    )
  }

  if (currentView === "groups") {
    return (
      <div className="min-h-screen bg-background">
        <GroupsView user={user} />
        <AIAssistant />
        <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    )
  }

  if (currentView === "profile") {
    return (
      <div className="min-h-screen bg-background">
        <ProfileView user={user} onBack={() => setCurrentView("home")} />
        <AIAssistant />
        <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <ProfileBubble />
      <div className="fixed top-4 left-4 z-40 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border shadow-sm">
        <div className="text-xs font-medium text-foreground truncate max-w-[200px]">{user?.fullName || "User"}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
          ID: {user?.uniqueId || user?.email?.split("@")[0] || "N/A"}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-sm mx-auto">
        <div className="text-center py-4 pt-16">
          <h1 className="text-lg font-bold text-foreground truncate">Welcome, {user?.fullName}</h1>
          <p className="text-sm text-muted-foreground">Stay safe during your journey</p>
        </div>

        {/* Safety Score */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">Safety Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{safetyScore}/100</span>
                <Badge
                  variant={safetyScore > 80 ? "default" : safetyScore > 60 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {safetyScore > 80 ? "Safe" : safetyScore > 60 ? "Moderate" : "High Risk"}
                </Badge>
              </div>
              <Progress value={safetyScore} className="w-full h-2" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Current location safety assessment based on real-time data
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weather */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">Weather & Climate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{weather.temp}°C</p>
                <p className="text-sm text-muted-foreground truncate">{weather.condition}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">Humidity: 65%</p>
                <p className="text-xs text-muted-foreground">Wind: 12 km/h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Monitor */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">Health Monitor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {!isDeviceConnected ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    Connect your health monitoring band to track vital signs
                  </p>
                  <Button onClick={connectHealthDevice} variant="outline" size="sm" className="w-full bg-transparent">
                    Connect Device
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Heart Rate</span>
                    <span className="text-lg font-bold text-primary">{heartRate ? `${heartRate} BPM` : "--"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="text-xs text-muted-foreground">Device Connected</span>
                  </div>
                  <Button onClick={disconnectHealthDevice} variant="destructive" size="sm" className="w-full">
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">Activity Log</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/50 min-w-0">
                <span className="text-sm truncate flex-1">Registered for tourist protection</span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">Today</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50 min-w-0">
                <span className="text-sm truncate flex-1">KYC verification completed</span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">Today</span>
              </div>
              <div className="flex items-center justify-between py-2 min-w-0">
                <span className="text-sm truncate flex-1">Location services enabled</span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AIAssistant />
      <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  )
}
