"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, Shield, MapPin, X, Wifi, WifiOff } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { pushClient } from "@/lib/push-client"

interface BlockchainSOSViewProps {
  user: any
}

export function BlockchainSOSView({ user }: BlockchainSOSViewProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [emergencyType, setEmergencyType] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false)
  const [emergencyId, setEmergencyId] = useState<string | null>(null)
  const { signer, address, isConnected } = useWallet()

  useEffect(() => {
    if (isConnected && signer) {
      initializeBlockchain()
    }
  }, [isConnected, signer])

  useEffect(() => {
    getCurrentLocation()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0 && isEmergencyActive && emergencyType) {
      declareBlockchainEmergency()
    }

    return () => clearInterval(interval)
  }, [countdown, isEmergencyActive, emergencyType])

  const initializeBlockchain = async () => {
    try {
      if (signer) {
        await pushClient.initialize(signer)
        setIsBlockchainConnected(true)
      }
    } catch (error) {
      console.error("Failed to initialize blockchain:", error)
      setIsBlockchainConnected(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Failed to get location:", error)
          // Default to Shillong coordinates
          setLocation({ lat: 25.5788, lng: 91.8933 })
        },
      )
    } else {
      setLocation({ lat: 25.5788, lng: 91.8933 })
    }
  }

  const activateEmergency = (type: string) => {
    if (!isBlockchainConnected) {
      alert("Please connect your wallet to use blockchain emergency features")
      return
    }
    setEmergencyType(type)
    setShowConfirmation(true)
  }

  const confirmEmergency = () => {
    setIsEmergencyActive(true)
    setCountdown(10) // 10 second countdown before alert is sent
    setShowConfirmation(false)
  }

  const declareBlockchainEmergency = async () => {
    try {
      const response = await fetch("/api/emergency/declare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          emergencyType,
          location,
          message: `Emergency declared by ${user?.name}`,
          severity: 1,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setEmergencyId(data.data.emergencyId)
        console.log("Emergency declared on blockchain:", data.data.emergencyId)
      }
    } catch (error) {
      console.error("Failed to declare emergency on blockchain:", error)
    }
  }

  const resolveEmergency = async () => {
    if (!emergencyId) return

    try {
      const response = await fetch(`/api/emergency/resolve/${emergencyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          resolution: "Emergency resolved by user",
        }),
      })

      const data = await response.json()
      if (data.success) {
        cancelEmergency()
      }
    } catch (error) {
      console.error("Failed to resolve emergency:", error)
    }
  }

  const cancelEmergency = () => {
    setIsEmergencyActive(false)
    setCountdown(0)
    setEmergencyType(null)
    setShowConfirmation(false)
    setEmergencyId(null)
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-destructive flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-destructive">
          <CardHeader className="text-center pb-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <CardTitle className="text-xl text-destructive">Confirm Emergency</CardTitle>
            <CardDescription className="text-sm">
              Are you sure you want to activate the blockchain emergency alert?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Emergency Type: {emergencyType}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This will record the emergency on blockchain and alert your travel groups via Push Protocol.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {isBlockchainConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-600" /> Blockchain Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-600" /> Blockchain Disconnected
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={cancelEmergency} variant="outline" className="flex-1 bg-transparent text-sm h-10">
                Cancel
              </Button>
              <Button
                onClick={confirmEmergency}
                variant="destructive"
                className="flex-1 text-sm h-10"
                disabled={!isBlockchainConnected}
              >
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
              {countdown > 0 ? `Blockchain alert in ${countdown} seconds` : "Emergency recorded on blockchain!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {countdown > 0
                  ? "You can still cancel this emergency alert"
                  : "Travel groups and emergency contacts have been notified via blockchain"}
              </AlertDescription>
            </Alert>

            {emergencyId && (
              <div className="bg-muted p-2 rounded-lg">
                <p className="text-xs font-medium">Emergency ID (Blockchain)</p>
                <p className="text-xs text-muted-foreground font-mono break-all">{emergencyId}</p>
              </div>
            )}

            {/* ... existing location and contact info ... */}

            <div className="flex gap-2">
              {countdown > 0 && (
                <Button onClick={cancelEmergency} variant="outline" className="flex-1 bg-transparent text-sm h-10">
                  <X className="w-4 h-4 mr-2" />
                  Cancel Emergency
                </Button>
              )}
              {countdown === 0 && emergencyId && (
                <Button onClick={resolveEmergency} variant="outline" className="flex-1 bg-transparent text-sm h-10">
                  <Shield className="w-4 h-4 mr-2" />
                  Resolve Emergency
                </Button>
              )}
            </div>
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
          <h1 className="text-xl font-bold text-foreground">Blockchain Emergency SOS</h1>
          <p className="text-sm text-muted-foreground">Decentralized emergency response system</p>
        </div>

        {/* Blockchain Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              Blockchain Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{isBlockchainConnected ? "Connected" : "Disconnected"}</p>
                <p className="text-xs text-muted-foreground">
                  {isBlockchainConnected
                    ? "Ready for blockchain emergency alerts"
                    : "Connect wallet to enable blockchain features"}
                </p>
              </div>
              <Badge
                className={`text-xs flex-shrink-0 ${
                  isBlockchainConnected
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {isBlockchainConnected ? "Online" : "Offline"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ... existing emergency buttons and contacts ... */}

        {/* Emergency Buttons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Blockchain Emergency Types</CardTitle>
            <CardDescription className="text-xs">
              Emergency alerts will be recorded on blockchain and sent via Push Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => activateEmergency("Medical Emergency")}
              variant="destructive"
              className="w-full h-12 text-sm"
              disabled={!isBlockchainConnected}
            >
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              Medical Emergency
            </Button>
            <Button
              onClick={() => activateEmergency("Security Threat")}
              variant="destructive"
              className="w-full h-12 text-sm"
              disabled={!isBlockchainConnected}
            >
              <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
              Security Threat
            </Button>
            <Button
              onClick={() => activateEmergency("Lost/Stranded")}
              variant="destructive"
              className="w-full h-12 text-sm"
              disabled={!isBlockchainConnected}
            >
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              Lost/Stranded
            </Button>
            <Button
              onClick={() => activateEmergency("General Emergency")}
              variant="destructive"
              className="w-full h-12 text-sm"
              disabled={!isBlockchainConnected}
            >
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              General Emergency
            </Button>
          </CardContent>
        </Card>

        {/* ... existing emergency contacts and personal info ... */}
      </div>
    </div>
  )
}
