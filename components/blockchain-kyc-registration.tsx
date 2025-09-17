"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, User, Phone, Mail, MapPin, Heart, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { WalletConnector } from "./wallet-connection"
import { useWallet } from "@/hooks/use-wallet"
import { kycService, type KYCData } from "@/lib/blockchain/kyc-service"

interface BlockchainKYCRegistrationProps {
  onComplete: (userData: any) => void
}

export function BlockchainKYCRegistration({ onComplete }: BlockchainKYCRegistrationProps) {
  const { wallet, isConnected, hasDID } = useWallet()
  const [formData, setFormData] = useState<KYCData>({
    fullName: "",
    email: "",
    phone: "",
    bloodGroup: "",
    emergencyContact: "",
    nationality: "",
    address: "",
  })

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [documents, setDocuments] = useState<{
    idDocument?: File
    addressProof?: File
    photo?: File
  }>({})
  const [verificationLevel, setVerificationLevel] = useState<"basic" | "enhanced" | "premium">("basic")
  const [kycStatus, setKycStatus] = useState<{
    isRegistered: boolean
    isVerified: boolean
    submissionHash?: string
    safetyScore?: number
  } | null>(null)

  useEffect(() => {
    if (wallet) {
      checkKYCStatus()
      calculateVerificationLevel()
    }
  }, [wallet, formData, documents])

  const checkKYCStatus = async () => {
    try {
      const status = await kycService.getKYCStatus()
      setKycStatus(status)

      if (status.isVerified) {
        // User is already verified, redirect to dashboard
        onComplete({
          ...formData,
          uniqueId: `TPA-${wallet?.address.slice(-6).toUpperCase()}`,
          registrationDate: new Date().toISOString(),
          kycVerified: true,
          blockchainVerified: true,
          did: wallet?.did.did,
        })
      }
    } catch (error) {
      console.error("Failed to check KYC status:", error)
    }
  }

  const calculateVerificationLevel = async () => {
    const level = await kycService.calculateVerificationLevel({ ...formData, documents })
    setVerificationLevel(level)
  }

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (type: "idDocument" | "addressProof" | "photo", file: File) => {
    setDocuments((prev) => ({ ...prev, [type]: file }))
  }

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      // Submit KYC to blockchain
      const submission = await kycService.registerTouristWithKYC(
        {
          ...formData,
          documents,
        },
        password,
      )

      // Create verifiable credential
      const credential = await kycService.createKYCCredential(formData, verificationLevel)

      const userData = {
        ...formData,
        uniqueId: `TPA-${wallet.address.slice(-6).toUpperCase()}`,
        registrationDate: new Date().toISOString(),
        kycVerified: false, // Will be verified by authorities
        blockchainVerified: true,
        did: wallet.did.did,
        submissionHash: submission.encryptedDataHash,
        verificationLevel,
        credential,
      }

      onComplete(userData)
    } catch (error: any) {
      setError(error.message || "Failed to submit KYC")
    } finally {
      setIsLoading(false)
    }
  }

  // Show wallet connection if not connected
  if (!isConnected || !hasDID) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Blockchain KYC Registration</h1>
            <p className="text-muted-foreground">Connect your wallet to start secure KYC verification</p>
          </div>
          <WalletConnector onWalletConnected={() => {}} />
        </div>
      </div>
    )
  }

  // Show existing verification status
  if (kycStatus?.isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">KYC Verified</CardTitle>
            <CardDescription>Your identity has been verified on the blockchain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Safety Score:</span>
                <Badge variant="secondary">{kycStatus.safetyScore}/100</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">DID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {wallet.did.did.slice(0, 20)}...
                </Badge>
              </div>
            </div>
            <Button onClick={() => onComplete({ kycVerified: true })} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Blockchain KYC</CardTitle>
          <CardDescription>Secure decentralized identity verification</CardDescription>

          {/* Progress indicator */}
          <div className="flex justify-center mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`w-8 h-2 mx-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {/* Verification level indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Verification Level:</span>
              <Badge
                variant={
                  verificationLevel === "premium"
                    ? "default"
                    : verificationLevel === "enhanced"
                      ? "secondary"
                      : "outline"
                }
              >
                {verificationLevel.toUpperCase()}
              </Badge>
            </div>
            <Progress
              value={verificationLevel === "basic" ? 33 : verificationLevel === "enhanced" ? 66 : 100}
              className="mt-2"
            />
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="button" onClick={handleNextStep} className="w-full">
                  Next Step
                </Button>
              </>
            )}

            {/* Step 2: Emergency & Location Details */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select onValueChange={(value) => handleInputChange("bloodGroup", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="emergencyContact"
                      placeholder="Emergency contact number"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Enter your nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1 bg-transparent">
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNextStep} className="flex-1">
                    Next Step
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Document Upload */}
            {step === 3 && (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-medium">Upload Documents (Optional)</h3>
                    <p className="text-sm text-muted-foreground">Higher verification level with documents</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="idDocument">ID Document</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="idDocument"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("idDocument", file)
                          }}
                          className="flex-1"
                        />
                        {documents.idDocument && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressProof">Address Proof</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="addressProof"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("addressProof", file)
                          }}
                          className="flex-1"
                        />
                        {documents.addressProof && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo">Profile Photo</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("photo", file)
                          }}
                          className="flex-1"
                        />
                        {documents.photo && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1 bg-transparent">
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNextStep} className="flex-1">
                    Next Step
                  </Button>
                </div>
              </>
            )}

            {/* Step 4: Security & Confirmation */}
            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Encryption Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This password encrypts your data on IPFS. Keep it safe!
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Blockchain KYC Summary:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Data encrypted and stored on IPFS</li>
                    <li>• Identity anchored on blockchain</li>
                    <li>• Verifiable credentials created</li>
                    <li>• Level: {verificationLevel.toUpperCase()}</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1 bg-transparent">
                    Previous
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Complete KYC"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
