"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Users } from "lucide-react"
import { pushClient } from "@/lib/push-client"
import { useWallet } from "@/hooks/use-wallet"
import { CONSTANTS } from "@/lib/constants" // Importing CONSTANTS

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  senderAddress: string
}

interface GroupChatProps {
  groupId: string
  groupName: string
  members: Array<{ id: string; name: string; walletAddress: string }>
}

export function GroupChat({ groupId, groupName, members }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { signer, address } = useWallet()

  useEffect(() => {
    initializePush()
  }, [signer])

  useEffect(() => {
    if (isInitialized) {
      loadMessages()
      setupMessageStream()
    }
  }, [isInitialized, groupId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializePush = async () => {
    if (!signer) return

    try {
      await pushClient.initialize(signer)
      setIsInitialized(true)
    } catch (error) {
      console.error("Failed to initialize Push:", error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const setupMessageStream = async () => {
    try {
      const stream = await pushClient.createStream()

      stream.on(CONSTANTS.STREAM.CHAT, (message: any) => {
        if (message.chatId === groupId) {
          const newMsg: Message = {
            id: message.messageId,
            sender: message.fromDID,
            content: message.messageContent,
            timestamp: new Date(message.timestamp),
            senderAddress: message.fromCAIP10,
          }
          setMessages((prev) => [...prev, newMsg])
        }
      })

      await stream.connect()
    } catch (error) {
      console.error("Failed to setup message stream:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: newMessage }),
      })

      if (response.ok) {
        setNewMessage("")
        // Message will be added via stream
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getSenderName = (senderAddress: string) => {
    const member = members.find((m) => m.walletAddress.toLowerCase() === senderAddress.toLowerCase())
    return member?.name || `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}`
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {groupName}
          <span className="text-sm text-muted-foreground ml-auto">{members.length} members</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderAddress.toLowerCase() === address?.toLowerCase() ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.senderAddress.toLowerCase() === address?.toLowerCase()
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">{getSenderName(message.senderAddress)}</div>
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={isLoading || !isInitialized}
            />
            <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim() || !isInitialized} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
