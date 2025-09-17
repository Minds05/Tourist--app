"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, QrCode, UserPlus, LogOut, Send, Shield } from "lucide-react"
import { BlockchainGroupsView } from "./blockchain-groups-view"
import { useWallet } from "@/hooks/use-wallet"

interface Group {
  id: string
  name: string
  code: string
  members: Member[]
  messages: Message[]
  createdBy: string
}

interface Member {
  id: string
  name: string
  role: "admin" | "member"
}

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
}

interface GroupsViewProps {
  user: any
}

export function GroupsView({ user }: GroupsViewProps) {
  const { isConnected } = useWallet()
  const [useBlockchain, setUseBlockchain] = useState(true)
  const [groups, setGroups] = useState<Group[]>([
    {
      id: "1",
      name: "Meghalaya Explorers",
      code: "MEG123",
      createdBy: user?.uniqueId,
      members: [
        { id: user?.uniqueId, name: user?.fullName, role: "admin" },
        { id: "2", name: "Sarah Johnson", role: "member" },
        { id: "3", name: "Mike Chen", role: "member" },
      ],
      messages: [
        { id: "1", sender: "Sarah Johnson", content: "Hey everyone! Excited for our trip!", timestamp: "10:30 AM" },
        {
          id: "2",
          sender: "Mike Chen",
          content: "Same here! What time are we meeting tomorrow?",
          timestamp: "10:35 AM",
        },
        { id: "3", sender: user?.fullName, content: "Let's meet at 9 AM at the hotel lobby", timestamp: "10:40 AM" },
      ],
    },
  ])

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [newMessage, setNewMessage] = useState("")

  const generateGroupCode = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  const createGroup = () => {
    if (!newGroupName.trim()) return

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      code: generateGroupCode(),
      createdBy: user?.uniqueId,
      members: [{ id: user?.uniqueId, name: user?.fullName, role: "admin" }],
      messages: [],
    }

    setGroups([...groups, newGroup])
    setNewGroupName("")
    setShowCreateGroup(false)
  }

  const joinGroup = () => {
    if (!joinCode.trim()) return

    // Simulate joining a group
    const mockGroup: Group = {
      id: Date.now().toString(),
      name: "Adventure Seekers",
      code: joinCode,
      createdBy: "other-user",
      members: [
        { id: "other-user", name: "Group Admin", role: "admin" },
        { id: user?.uniqueId, name: user?.fullName, role: "member" },
      ],
      messages: [{ id: "1", sender: "Group Admin", content: "Welcome to the group!", timestamp: "Just now" }],
    }

    setGroups([...groups, mockGroup])
    setJoinCode("")
    setShowJoinGroup(false)
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedGroup) return

    const message: Message = {
      id: Date.now().toString(),
      sender: user?.fullName,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    const updatedGroups = groups.map((group) =>
      group.id === selectedGroup.id ? { ...group, messages: [...group.messages, message] } : group,
    )

    setGroups(updatedGroups)
    setSelectedGroup({ ...selectedGroup, messages: [...selectedGroup.messages, message] })
    setNewMessage("")
  }

  const leaveGroup = (groupId: string) => {
    setGroups(groups.filter((group) => group.id !== groupId))
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null)
    }
  }

  if (useBlockchain && isConnected) {
    return <BlockchainGroupsView user={user} />
  }

  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="p-4 border-b bg-card">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setSelectedGroup(null)} size="sm">
                ← Back
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold">{selectedGroup.name}</h1>
                <p className="text-sm text-muted-foreground">{selectedGroup.members.length} members</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveGroup(selectedGroup.id)}
                className="bg-transparent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {selectedGroup.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === user?.fullName ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.sender === user?.fullName
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.sender !== user?.fullName && <p className="text-xs font-medium mb-1">{message.sender}</p>}
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-card">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showCreateGroup) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowCreateGroup(false)} size="sm">
              ← Back
            </Button>
            <h1 className="text-xl font-bold">Create Group</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New Travel Group</CardTitle>
              <CardDescription>Create a group to coordinate with fellow travelers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Group Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Share locations and safety updates</li>
                  <li>• Coordinate travel plans</li>
                  <li>• Emergency group alerts</li>
                  <li>• Real-time messaging</li>
                </ul>
              </div>
              <Button onClick={createGroup} className="w-full">
                Create Group
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showJoinGroup) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowJoinGroup(false)} size="sm">
              ← Back
            </Button>
            <h1 className="text-xl font-bold">Join Group</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Join Travel Group</CardTitle>
              <CardDescription>Enter the group code or scan QR code to join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code">Enter Code</TabsTrigger>
                  <TabsTrigger value="qr">Scan QR</TabsTrigger>
                </TabsList>
                <TabsContent value="code" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">6-Digit Group Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="Enter group code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={joinGroup} className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </Button>
                </TabsContent>
                <TabsContent value="qr" className="space-y-4">
                  <div className="text-center p-8 bg-muted rounded-lg">
                    <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">QR code scanner would be available here</p>
                  </div>
                  <Button className="w-full" disabled>
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        {/* Header with blockchain toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Travel Groups</h1>
            <p className="text-muted-foreground">Connect with fellow travelers</p>
          </div>
          <div className="flex gap-2">
            <Button variant={useBlockchain ? "default" : "outline"} onClick={() => setUseBlockchain(true)} size="sm">
              <Shield className="w-4 h-4 mr-1" />
              Blockchain
            </Button>
            <Button
              variant={!useBlockchain ? "default" : "outline"}
              onClick={() => setUseBlockchain(false)}
              size="sm"
              className={useBlockchain ? "bg-transparent" : ""}
            >
              <Users className="w-4 h-4 mr-1" />
              Classic
            </Button>
          </div>
        </div>

        {/* Show blockchain prompt if not connected */}
        {useBlockchain && !isConnected && (
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Blockchain Groups Available</h3>
              <p className="text-muted-foreground mb-4">
                Connect your wallet to access decentralized group features with enhanced security and verification.
              </p>
              <Button onClick={() => setUseBlockchain(false)} variant="outline" className="bg-transparent">
                Use Classic Groups Instead
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Classic groups implementation would go here */}
        {!useBlockchain && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Classic groups feature coming soon</p>
              <Button onClick={() => setUseBlockchain(true)}>Try Blockchain Groups</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
