"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Send, X, MapPin, AlertTriangle, Compass, Phone } from "lucide-react"

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [conversation, setConversation] = useState([
    {
      type: "assistant",
      content:
        "Hi! I'm your travel safety assistant. I can help you with directions, safety information, emergency contacts, and local recommendations. How can I assist you today?",
    },
  ])

  const quickActions = [
    { icon: MapPin, label: "Find nearby hospitals", action: "hospitals" },
    { icon: AlertTriangle, label: "Safety alerts", action: "safety" },
    { icon: Compass, label: "Best routes", action: "routes" },
    { icon: Phone, label: "Emergency contacts", action: "emergency" },
  ]

  const handleQuickAction = (action: string) => {
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
          "Emergency contacts: Police: 100, Fire: 101, Ambulance: 102, Tourist Helpline: 1363. Your emergency contact (John Doe) will be notified if you use SOS. Local police station: +91-364-2226999"
        break
    }

    setConversation((prev) => [
      ...prev,
      { type: "user", content: quickActions.find((a) => a.action === action)?.label || "" },
      { type: "assistant", content: response },
    ])
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

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
    }, 1000)
  }

  const handleCancel = () => {
    setConversation([
      {
        type: "assistant",
        content:
          "Hi! I'm your travel safety assistant. I can help you with directions, safety information, emergency contacts, and local recommendations. How can I assist you today?",
      },
    ])
    setMessage("")
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-32 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-lg"
          size="lg"
        >
          <Bot className="w-5 h-5" />
        </Button>
        <div className="absolute -top-1 -left-1">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-32 left-2 right-2 z-50 max-w-xs mx-auto">
      <Card className="shadow-2xl border-2">
        <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Bot className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">Travel Assistant</h3>
              <p className="text-xs opacity-90 truncate">Online • Ready to help</p>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-7 w-7 p-0"
              title="Clear conversation"
            >
              <X className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Quick Actions */}
          <div className="p-3 border-b bg-muted/50">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Quick Help:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.action)}
                  className="h-auto py-1.5 px-2 flex items-center gap-1 text-xs min-w-0"
                >
                  <action.icon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="h-40 overflow-y-auto p-3 space-y-2">
            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-xs leading-relaxed break-words ${
                    msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="text-xs h-8 min-w-0 flex-1"
              />
              <Button size="sm" onClick={handleSendMessage} className="h-8 w-8 p-0 flex-shrink-0">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
