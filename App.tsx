"use client"

import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Import screens
import { KYCRegistration } from "./components/KYCRegistration"
import { LoginForm } from "./components/LoginForm"
import { HomeDashboard } from "./components/HomeDashboard"
import { MapsView } from "./components/MapsView"
import { SOSView } from "./components/SOSView"
import { TripsView } from "./components/TripsView"
import { GroupsView } from "./components/GroupsView"
import { PermissionsManager } from "./components/PermissionsManager"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function MainTabs({ user }: { user: any }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Maps") {
            iconName = focused ? "map" : "map-outline"
          } else if (route.name === "SOS") {
            iconName = focused ? "warning" : "warning-outline"
          } else if (route.name === "Trips") {
            iconName = focused ? "navigate" : "navigate-outline"
          } else if (route.name === "Groups") {
            iconName = focused ? "people" : "people-outline"
          } else {
            iconName = "home-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">{() => <HomeDashboard user={user} />}</Tab.Screen>
      <Tab.Screen name="Maps" component={MapsView} />
      <Tab.Screen
        name="SOS"
        options={{
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarActiveTintColor: "#EF4444",
          tabBarInactiveTintColor: "#EF4444",
        }}
      >
        {() => <SOSView user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Trips">{() => <TripsView user={user} />}</Tab.Screen>
      <Tab.Screen name="Groups">{() => <GroupsView user={user} />}</Tab.Screen>
    </Tab.Navigator>
  )
}

function AuthStack() {
  const [currentStep, setCurrentStep] = useState<"kyc" | "login">("kyc")
  const [user, setUser] = useState<any>(null)

  const handleKYCComplete = async (userData: any) => {
    await AsyncStorage.setItem("tourist-registered", "true")
    await AsyncStorage.setItem("tourist-user", JSON.stringify(userData))
    setUser(userData)
  }

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
  }

  if (user) {
    return <MainTabs user={user} />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {currentStep === "kyc" ? (
        <Stack.Screen name="KYC">{() => <KYCRegistration onComplete={handleKYCComplete} />}</Stack.Screen>
      ) : (
        <Stack.Screen name="Login">{() => <LoginForm onSuccess={handleLoginSuccess} />}</Stack.Screen>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [currentView, setCurrentView] = useState("home")
  const [permissionsGranted, setPermissionsGranted] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("tourist-user")
      const registered = await AsyncStorage.getItem("tourist-registered")

      if (savedUser && registered) {
        setUser(JSON.parse(savedUser))
        setIsRegistered(true)
      } else if (registered) {
        setIsRegistered(true)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
    }
  }

  if (!permissionsGranted) {
    return <PermissionsManager onPermissionsGranted={() => setPermissionsGranted(true)} />
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      {user ? <MainTabs user={user} /> : <AuthStack />}
    </NavigationContainer>
  )
}
