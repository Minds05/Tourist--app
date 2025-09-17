"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  Shield,
  Settings,
  Moon,
  Sun,
  Bell,
  MapPin,
  Languages,
  LogOut,
  Edit,
  Save,
  Camera,
  ArrowLeft,
} from "lucide-react"

interface ProfileViewProps {
  user: any
  onBack?: () => void
}

export function ProfileView({ user, onBack }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [locationAlerts, setLocationAlerts] = useState(true)
  const [emergencyNotifications, setEmergencyNotifications] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [editedUser, setEditedUser] = useState(user)

  const handleSave = () => {
    // In a real app, this would update the user data
    localStorage.setItem("tourist-user", JSON.stringify(editedUser))
    setIsEditing(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("tourist-user")
    localStorage.removeItem("tourist-registered")
    window.location.reload()
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-3 py-4 space-y-4 max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 py-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="w-8 h-8 p-0 rounded-full flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 text-center min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">Profile</h1>
            <p className="text-xs text-muted-foreground truncate">Manage your account and preferences</p>
          </div>
          <div className="w-8 flex-shrink-0"></div> {/* Spacer for centering */}
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="text-xs">
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3">
            {/* Profile Picture */}
            <Card>
              <CardContent className="p-4 text-center">
                <div className="relative inline-block">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarFallback className="text-lg">
                      {user?.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 p-0">
                    <Camera className="w-3 h-3" />
                  </Button>
                </div>
                <h2 className="text-lg font-bold truncate">{user?.fullName}</h2>
                <p className="text-xs text-muted-foreground truncate">Tourist ID: {user?.uniqueId}</p>
                <Badge className="mt-2 bg-green-100 text-green-800 border-green-300 text-xs">KYC Verified</Badge>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between min-w-0">
                  <CardTitle className="flex items-center gap-2 text-sm min-w-0 flex-1">
                    <User className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">Personal Information</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    className="bg-transparent text-xs h-7 flex-shrink-0"
                  >
                    {isEditing ? <Save className="w-3 h-3 mr-1" /> : <Edit className="w-3 h-3 mr-1" />}
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-xs">
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="fullName"
                        value={editedUser?.fullName || ""}
                        onChange={(e) => setEditedUser({ ...editedUser, fullName: e.target.value })}
                        className="text-xs h-8"
                      />
                    ) : (
                      <p className="text-xs p-2 bg-muted rounded truncate">{user?.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs">
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedUser?.email || ""}
                        onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                        className="text-xs h-8"
                      />
                    ) : (
                      <p className="text-xs p-2 bg-muted rounded truncate">{user?.email}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">
                        Phone
                      </Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editedUser?.phone || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                          className="text-xs h-8"
                        />
                      ) : (
                        <p className="text-xs p-2 bg-muted rounded break-all leading-relaxed">{user?.phone}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="nationality" className="text-xs">
                        Nationality
                      </Label>
                      {isEditing ? (
                        <Input
                          id="nationality"
                          value={editedUser?.nationality || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, nationality: e.target.value })}
                          className="text-xs h-8"
                        />
                      ) : (
                        <p className="text-xs p-2 bg-muted rounded truncate">{user?.nationality}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate">Emergency Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="bloodGroup" className="text-xs">
                      Blood Group
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editedUser?.bloodGroup}
                        onValueChange={(value) => setEditedUser({ ...editedUser, bloodGroup: value })}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
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
                    ) : (
                      <p className="text-xs p-2 bg-muted rounded">{user?.bloodGroup}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="emergencyContact" className="text-xs">
                      Emergency Contact
                    </Label>
                    {isEditing ? (
                      <Input
                        id="emergencyContact"
                        value={editedUser?.emergencyContact || ""}
                        onChange={(e) => setEditedUser({ ...editedUser, emergencyContact: e.target.value })}
                        className="text-xs h-8"
                      />
                    ) : (
                      <p className="text-xs p-2 bg-muted rounded break-all leading-relaxed">{user?.emergencyContact}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-3">
            {/* Theme Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {isDarkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                  <span className="truncate">Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Dark Mode</p>
                    <p className="text-xs text-muted-foreground truncate">Switch between light and dark themes</p>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={toggleTheme} className="flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate">Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Location Alerts</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Get notified when staying in one location too long
                    </p>
                  </div>
                  <Switch checked={locationAlerts} onCheckedChange={setLocationAlerts} className="flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Emergency Notifications</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Receive emergency alerts and safety updates
                    </p>
                  </div>
                  <Switch
                    checked={emergencyNotifications}
                    onCheckedChange={setEmergencyNotifications}
                    className="flex-shrink-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Languages className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate">Language & Translation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="language" className="text-xs">
                    App Language
                  </Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="assamese">Assamese</SelectItem>
                      <SelectItem value="bengali">Bengali</SelectItem>
                      <SelectItem value="khasi">Khasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs font-medium mb-1">AI Translation</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Speak or type in your native language and the AI will translate to the local language for better
                    communication with locals.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate">Privacy & Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Location Services</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Allow app to access your location for safety features
                    </p>
                  </div>
                  <Switch checked={true} disabled className="flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Share Location with Groups</p>
                    <p className="text-xs text-muted-foreground">Let group members see your location</p>
                  </div>
                  <Switch checked={true} className="flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate">Account</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent text-xs h-8">
                  <Shield className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">Privacy Policy</span>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent text-xs h-8">
                  <User className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">Terms of Service</span>
                </Button>
                <Button variant="destructive" onClick={handleLogout} className="w-full justify-start text-xs h-8">
                  <LogOut className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">Sign Out</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
