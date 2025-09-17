"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Speech from "expo-speech"
import * as Haptics from "expo-haptics"

const { width } = Dimensions.get("window")

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversation, setConversation] = useState([
    {
      type: "assistant",
      content:
        "Hi! I'm your travel safety assistant. I can help you with directions, safety information, emergency contacts, and local recommendations. How can I assist you today?",
    },
  ])
  const [pulseAnim] = useState(new Animated.Value(1))

  const quickActions = [
    { icon: "medical", label: "Find nearby hospitals", action: "hospitals" },
    { icon: "warning", label: "Safety alerts", action: "safety" },
    { icon: "compass", label: "Best routes", action: "routes" },
    { icon: "call", label: "Emergency contacts", action: "emergency" },
  ]

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isListening])

  const handleQuickAction = async (action: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    let response = ""
    switch (action) {
      case "hospitals":
        response =
          "I found 3 hospitals near you: Civil Hospital Shillong (0.5km), Bethany Hospital (1.2km), and NEIGRIHMS (3.4km). Civil Hospital is the closest and has 24/7 emergency services."
        break
      case "safety":
        response =
          "Current safety status: Your area is SAFE (85/100). No active alerts. Avoid the area near Laitumkhrah after 10 PM due to poor lighting. Weather is clear for outdoor activities."
        break
      case "routes":
        response =
          "For your current location, I recommend taking the main road through Police Bazaar. It's well-lit, has good mobile coverage, and police patrol regularly. Avoid shortcuts through isolated areas."
        break
      case "emergency":
        response =
          "Emergency contacts: Police: 100, Fire: 101, Ambulance: 102, Tourist Helpline: 1363. Your emergency contact will be notified if you use SOS. Local police station: +91-364-2226999"
        break
    }

    const actionLabel = quickActions.find((a) => a.action === action)?.label || ""
    setConversation((prev) => [
      ...prev,
      { type: "user", content: actionLabel },
      { type: "assistant", content: response },
    ])

    // Speak the response
    speakText(response)
  }

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true)
      await Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    } catch (error) {
      console.error("Speech error:", error)
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    Speech.stop()
    setIsSpeaking(false)
  }

  const startListening = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setIsListening(true)

      // Simulate speech recognition (in a real app, use expo-speech-recognition or similar)
      setTimeout(() => {
        setIsListening(false)
        Alert.alert(
          "Voice Input",
          "Voice recognition is not available in this demo. Please type your message instead.",
          [{ text: "OK" }],
        )
      }, 2000)
    } catch (error) {
      console.error("Speech recognition error:", error)
      setIsListening(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const userMessage = message
    setMessage("")

    // Add user message
    setConversation((prev) => [...prev, { type: "user", content: userMessage }])

    // Simulate AI response
    setTimeout(() => {
      let response = "I understand you're asking about: " + userMessage + ". Let me help you with that. "

      if (userMessage.toLowerCase().includes("weather")) {
        response =
          "Current weather in Shillong: 24°C, partly cloudy. Good conditions for sightseeing. UV index is moderate, so sunscreen is recommended. No rain expected today."
      } else if (userMessage.toLowerCase().includes("food") || userMessage.toLowerCase().includes("restaurant")) {
        response =
          "Great local restaurants near you: Cafe Shillong (0.3km) - famous for local cuisine, ML05 Cafe (0.5km) - continental food, City Hut Family Dhaba (0.7km) - North Indian. All are tourist-friendly with good hygiene ratings."
      } else if (userMessage.toLowerCase().includes("transport")) {
        response =
          "Transportation options: Local taxis are available via phone booking (+91-364-2500100). Shared cabs run on fixed routes. For sightseeing, I recommend booking a registered tourist taxi. Avoid unmarked vehicles for safety."
      } else {
        response +=
          "Based on your location in Shillong, I can provide specific local information. Feel free to ask about safety, directions, weather, food, or any travel concerns!"
      }

      setConversation((prev) => [...prev, { type: "assistant", content: response }])

      // Speak the response
      speakText(response)
    }, 1000)
  }

  const handleClear = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setConversation([
      {
        type: "assistant",
        content:
          "Hi! I'm your travel safety assistant. I can help you with directions, safety information, emergency contacts, and local recommendations. How can I assist you today?",
      },
    ])
    setMessage("")
    stopSpeaking()
  }

  const toggleAssistant = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsOpen(!isOpen)
    if (!isOpen) {
      stopSpeaking()
    }
  }

  if (!isOpen) {
    return (
      <View style={styles.floatingButton}>
        <TouchableOpacity style={styles.assistantButton} onPress={toggleAssistant}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.assistantContainer}>
      <View style={styles.assistantCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Travel Assistant</Text>
              <Text style={styles.headerSubtitle}>Online • Ready to help</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClear}>
              <Ionicons name="refresh" size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={toggleAssistant}>
              <Ionicons name="close" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Help:</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.action)}
              >
                <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={14} color="#6366F1" />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conversation */}
        <ScrollView style={styles.conversationContainer} showsVerticalScrollIndicator={false}>
          {conversation.map((msg, index) => (
            <View key={index} style={[styles.messageContainer, msg.type === "user" && styles.userMessageContainer]}>
              <View style={[styles.messageBubble, msg.type === "user" ? styles.userBubble : styles.assistantBubble]}>
                <Text
                  style={[
                    styles.messageText,
                    msg.type === "user" ? styles.userMessageText : styles.assistantMessageText,
                  ]}
                >
                  {msg.content}
                </Text>
                {msg.type === "assistant" && (
                  <TouchableOpacity
                    style={styles.speakButton}
                    onPress={() => (isSpeaking ? stopSpeaking() : speakText(msg.content))}
                  >
                    <Ionicons name={isSpeaking ? "stop" : "volume-high"} size={12} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me anything..."
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.voiceButton} onPress={startListening} disabled={isListening}>
              <Animated.View style={[styles.voiceButtonInner, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name={isListening ? "stop" : "mic"} size={16} color="#6366F1" />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Ionicons name="send" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 100,
    right: 16,
    zIndex: 50,
  },
  assistantButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  onlineIndicator: {
    position: "absolute",
    top: -2,
    left: -2,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  assistantContainer: {
    position: "absolute",
    bottom: 100,
    left: 8,
    right: 8,
    zIndex: 50,
  },
  assistantCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    maxHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#6366F1",
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    marginLeft: 8,
    flex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 4,
  },
  headerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  quickActionsContainer: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flex: 1,
    minWidth: "45%",
  },
  quickActionText: {
    fontSize: 11,
    color: "#374151",
    marginLeft: 4,
    flex: 1,
  },
  conversationContainer: {
    maxHeight: 200,
    padding: 12,
  },
  messageContainer: {
    marginBottom: 8,
    alignItems: "flex-start",
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 8,
    borderRadius: 8,
    position: "relative",
  },
  assistantBubble: {
    backgroundColor: "#F3F4F6",
  },
  userBubble: {
    backgroundColor: "#6366F1",
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16,
  },
  assistantMessageText: {
    color: "#111827",
  },
  userMessageText: {
    color: "#ffffff",
  },
  speakButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    maxHeight: 80,
    textAlignVertical: "top",
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
})
