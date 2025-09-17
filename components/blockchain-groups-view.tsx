"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Plus, MessageCircle, UserPlus, LogOut, Send, Shield, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { groupService, type BlockchainGroup } from "@/lib/blockchain/group-service"

interface BlockchainGroupsViewProps {
  user: any
}

export function BlockchainGroupsView({ user }: BlockchainGroupsViewProps) {
  const { wallet, isConnected } = useWallet()
  const [groups, setGroups] = useState<BlockchainGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<BlockchainGroup | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create group form
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    maxMembers: "10",
    description: "",
  })

  // Join group form
  const [joinData, setJoinData] = useState({
    inviteCode: "",
    emergencyContact: "",
  })

  // Messages
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (isConnected && wallet) {
      loadUserGroups()
    }
  }, [isConnected, wallet])

  const loadUserGroups = async () => {
    try {
      setIsLoading(true)
      const groupIds = await groupService.getUserGroups()

      const groupsData = await Promise.all(
        groupIds.map(async (id) => {
          try {
            return await groupService.getGroup(id)
          } catch (error) {
            console.error(`Failed to load group ${id}:`, error)
            return null
          }
        }),
      )

      setGroups(groupsData.filter(Boolean) as BlockchainGroup[])
    } catch (error: any) {
      setError(error.message || "Failed to load groups")
    } finally {
      setIsLoading(false)
    }
  }

  const createGroup = async () => {
    if (!newGroupData.name.trim() || !newGroupData.destination.trim()) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const startDate = new Date(newGroupData.startDate)
      const endDate = new Date(newGroupData.endDate)

      const groupId = await groupService.createGroup(
        newGroupData.name,
        newGroupData.destination,
        startDate,
        endDate,
        Number.parseInt(newGroupData.maxMembers),
        newGroupData.description,
      )

      // Create group membership credential
      await groupService.createGroupCredential(groupId, "admin")

      // Reset form and reload groups
      setNewGroupData({
        name: "",
        destination: "",
        startDate: "",
        endDate: "",
        maxMembers: "10",
        description: "",
      })
      setShowCreateGroup(false)
      await loadUserGroups()
    } catch (error: any) {
      setError(error.message || "Failed to create group")
    } finally {
      setIsLoading(false)
    }
  }

  const joinGroup = async () => {
    if (!joinData.inviteCode.trim() || !joinData.emergencyContact.trim()) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await groupService.joinGroupByInviteCode(joinData.inviteCode, joinData.emergencyContact)

      // Reset form and reload groups
      setJoinData({ inviteCode: "", emergencyContact: "" })
      setShowJoinGroup(false)
      await loadUserGroups()
    } catch (error: any) {
      setError(error.message || "Failed to join group")
    } finally {
      setIsLoading(false)
    }
  }

  const leaveGroup = async (groupId: number) => {
    try {
      setIsLoading(true)
      await groupService.leaveGroup(groupId)
      await loadUserGroups()

      if (selectedGroup?.groupId === groupId) {
        setSelectedGroup(null)
      }
    } catch (error: any) {
      setError(error.message || "Failed to leave group")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return

    try {
      await groupService.sendMessage(selectedGroup.groupId, newMessage, false)
      setNewMessage("")
      // In a real app, you'd listen for blockchain events to update messages
    } catch (error: any) {
      setError(error.message || "Failed to send message")
    }
  }

  const sendEmergencyMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return

    try {
      await groupService.sendMessage(selectedGroup.groupId, `🚨 EMERGENCY: ${newMessage}`, true)
      setNewMessage("")
    } catch (error: any) {
      setError(error.message || "Failed to send emergency message")
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Blockchain Groups</CardTitle>
            <CardDescription>Connect your wallet to access decentralized group features</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please connect your wallet to use blockchain-powered group features.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
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
                <h1 className="text-lg font-bold flex items-center gap-2">
                  {selectedGroup.name}
                  <Shield className="w-4 h-4 text-primary" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedGroup.currentMembers}/{selectedGroup.maxMembers} members • Blockchain verified
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveGroup(selectedGroup.groupId)}
                disabled={isLoading}
                className="bg-transparent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Group Info */}
          <div className="p-4 bg-muted/50 border-b">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Destination:</span>
                <p className="text-muted-foreground">{selectedGroup.destination}</p>
              </div>
              <div>
                <span className="font-medium">Group ID:</span>
                <p className="text-muted-foreground font-mono">#{selectedGroup.groupId}</p>
              </div>
            </div>
          </div>

          {/* Messages placeholder */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2" />
              <p>Blockchain messaging coming soon</p>
              <p className="text-xs">Messages will be encrypted and stored on IPFS</p>
            </div>
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
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
              <Button onClick={sendEmergencyMessage} variant="destructive" disabled={!newMessage.trim()}>
                🚨
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
            <h1 className="text-xl font-bold">Create Blockchain Group</h1>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                New Travel Group
              </CardTitle>
              <CardDescription>Create a decentralized group with blockchain verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  placeholder="Where are you traveling?"
                  value={newGroupData.destination}
                  onChange={(e) => setNewGroupData({ ...newGroupData, destination: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newGroupData.startDate}
                    onChange={(e) => setNewGroupData({ ...newGroupData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newGroupData.endDate}
                    onChange={(e) => setNewGroupData({ ...newGroupData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="2"
                  max="50"
                  value={newGroupData.maxMembers}
                  onChange={(e) => setNewGroupData({ ...newGroupData, maxMembers: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the group"
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Blockchain Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Immutable group records</li>
                  <li>• Encrypted messaging on IPFS</li>
                  <li>• Verifiable membership credentials</li>
                  <li>• Emergency alert system</li>
                </ul>
              </div>

              <Button onClick={createGroup} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Group...
                  </>
                ) : (
                  "Create Group"
                )}
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
            <h1 className="text-xl font-bold">Join Blockchain Group</h1>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Join Travel Group
              </CardTitle>
              <CardDescription>Enter invite code to join a blockchain-verified group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code *</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter group invite code"
                  value={joinData.inviteCode}
                  onChange={(e) => setJoinData({ ...joinData, inviteCode: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Emergency contact phone number"
                  value={joinData.emergencyContact}
                  onChange={(e) => setJoinData({ ...joinData, emergencyContact: e.target.value })}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">What happens when you join:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your DID is verified on blockchain</li>
                  <li>• Membership credential is issued</li>
                  <li>• Emergency contact is encrypted and stored</li>
                  <li>• Access to group messaging and coordination</li>
                </ul>
              </div>

              <Button onClick={joinGroup} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining Group...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Travel Groups
              <Shield className="w-6 h-6 text-primary" />
            </h1>
            <p className="text-muted-foreground">Blockchain-powered group coordination</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowJoinGroup(true)} size="sm" className="bg-transparent">
              <UserPlus className="w-4 h-4 mr-1" />
              Join
            </Button>
            <Button onClick={() => setShowCreateGroup(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading groups...</span>
          </div>
        )}

        {/* Groups List */}
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.groupId} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.currentMembers}/{group.maxMembers} members
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="bg-transparent">
                      {group.creator === wallet?.address ? "Admin" : "Member"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Destination:</span>
                    <span className="text-muted-foreground">{group.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Group ID:</span>
                    <span className="text-muted-foreground font-mono">#{group.groupId}</span>
                  </div>
                </div>

                <Progress value={(group.currentMembers / group.maxMembers) * 100} className="mb-3" />

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setSelectedGroup(group)}>
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Open Group
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => leaveGroup(group.groupId)}
                    disabled={isLoading}
                    className="bg-transparent"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {groups.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No blockchain groups yet</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowCreateGroup(true)}>Create Group</Button>
                  <Button variant="outline" onClick={() => setShowJoinGroup(true)} className="bg-transparent">
                    Join Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
