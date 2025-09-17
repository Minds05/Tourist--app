"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, Shield, MapPin, X } from "lucide-react"

interface SOSViewProps {
  user: any
}

export function SOSView({ user }: SOSViewProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [emergencyType, setEmergencyType] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0 && isEmergencyActive) {
      // Emergency alert would be sent here
      console.log("Emergency alert sent!")
    }

    return () => clearInterval(interval)
  }, [countdown, isEmergencyActive])

  const activateEmergency = (type: string) => {
    setEmergencyType(type)
    setShowConfirmation(true)
  }

  const confirmEmergency = () => {
    setIsEmergencyActive(true)
    setCountdown(10) // 10 second countdown before alert is sent
    setShowConfirmation(false)
  }

  const cancelEmergency = () => {
    setIsEmergencyActive(false)
    setCountdown(0)
    setEmergencyType(null)
    setShowConfirmation(false)
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-destructive flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-destructive">
          <CardHeader className="text-center pb-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <CardTitle className="text-xl text-destructive">Confirm Emergency</CardTitle>
            <CardDescription className="text-sm">
              Are you sure you want to activate the emergency alert?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Emergency Type: {emergencyType}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This will immediately alert local authorities and your emergency contacts.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={cancelEmergency} variant="outline" className="flex-1 bg-transparent text-sm h-10">
                Cancel
              </Button>
              <Button onClick={confirmEmergency} variant="destructive" className="flex-1 text-sm h-10">
                Confirm Emergency
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isEmergencyActive) {
    return (
      <div className="min-h-screen bg-destructive flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-destructive">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-destructive-foreground" />
            </div>
            <CardTitle className="text-xl text-destructive">EMERGENCY ACTIVE</CardTitle>
            <CardDescription className="text-sm">
              {countdown > 0 ? `Alert will be sent in ${countdown} seconds` : "Emergency alert has been sent!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {countdown > 0
                  ? "You can still cancel this emergency alert"
                  : "Authorities and emergency contacts have been notified"}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">Location Shared</p>
                  <p className="text-xs text-muted-foreground">Shillong, Meghalaya</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">Emergency Contact</p>
                  <p className="text-xs text-muted-foreground break-all">{user?.emergencyContact}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">Tourist ID</p>
                  <p className="text-xs text-muted-foreground">{user?.uniqueId}</p>
                </div>
              </div>
            </div>

            {countdown > 0 && (
              <Button onClick={cancelEmergency} variant="outline" className="w-full bg-transparent text-sm h-10">
                <X className="w-4 h-4 mr-2" />
                Cancel Emergency
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-3 py-4 space-y-4 max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-xl font-bold text-foreground">Emergency SOS</h1>
          <p className="text-sm text-muted-foreground">Quick access to emergency services</p>
        </div>

        {/* Emergency Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              Emergency Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">System Active</p>
                <p className="text-xs text-muted-foreground">Ready to send emergency alerts</p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-300 text-xs flex-shrink-0">Online</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Buttons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Emergency Types</CardTitle>
            <CardDescription className="text-xs">Select the type of emergency you're experiencing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => activateEmergency("Medical Emergency")}
              variant="destructive"
              className="w-full h-12 text-sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              Medical Emergency
            </Button>
            <Button
              onClick={() => activateEmergency("Security Threat")}
              variant="destructive"
              className="w-full h-12 text-sm"
            >
              <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
              Security Threat
            </Button>
            <Button
              onClick={() => activateEmergency("Lost/Stranded")}
              variant="destructive"
              className="w-full h-12 text-sm"
            >
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              Lost/Stranded
            </Button>
            <Button
              onClick={() => activateEmergency("General Emergency")}
              variant="destructive"
              className="w-full h-12 text-sm"
            >
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              General Emergency
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Emergency Contacts</CardTitle>
            <CardDescription className="text-xs">Quick dial emergency numbers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 bg-transparent">
                <Phone className="w-4 h-4" />
                <div className="text-center">
                  <p className="text-xs font-medium">Police</p>
                  <p className="text-xs text-muted-foreground">100</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 bg-transparent">
                <Phone className="w-4 h-4" />
                <div className="text-center">
                  <p className="text-xs font-medium">Ambulance</p>
                  <p className="text-xs text-muted-foreground">108</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 bg-transparent">
                <Phone className="w-4 h-4" />
                <div className="text-center">
                  <p className="text-xs font-medium">Fire</p>
                  <p className="text-xs text-muted-foreground">101</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 bg-transparent">
                <Phone className="w-4 h-4" />
                <div className="text-center">
                  <p className="text-xs font-medium">Tourist Helpline</p>
                  <p className="text-xs text-muted-foreground">1363</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Emergency Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your Emergency Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-xs font-medium">Blood Group</span>
              <span className="text-xs">{user?.bloodGroup}</span>
            </div>
            <div className="flex items-start justify-between py-1 border-b">
              <span className="text-xs font-medium flex-shrink-0">Emergency Contact</span>
              <span className="text-xs text-right break-all ml-2">{user?.emergencyContact}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-medium">Tourist ID</span>
              <span className="text-xs">{user?.uniqueId}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
