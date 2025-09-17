"use client"

import { useState, useEffect } from "react"
import { KYCRegistration } from "@/components/kyc-registration"
import { LoginForm } from "@/components/login-form"
import { HomeDashboard } from "@/components/home-dashboard"

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<"kyc" | "login" | "home">("kyc")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is already registered and logged in
    const savedUser = localStorage.getItem("tourist-user")
    const isRegistered = localStorage.getItem("tourist-registered")

    if (savedUser && isRegistered) {
      setUser(JSON.parse(savedUser))
      setCurrentStep("home")
    } else if (isRegistered) {
      setCurrentStep("login")
    }
  }, [])

  const handleKYCComplete = (userData: any) => {
    localStorage.setItem("tourist-registered", "true")
    localStorage.setItem("tourist-user", JSON.stringify(userData))
    setUser(userData)
    setCurrentStep("home")
  }

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
    setCurrentStep("home")
  }

  if (currentStep === "kyc") {
    return <KYCRegistration onComplete={handleKYCComplete} />
  }

  if (currentStep === "login") {
    return <LoginForm onSuccess={handleLoginSuccess} />
  }

  return <HomeDashboard user={user} />
}
