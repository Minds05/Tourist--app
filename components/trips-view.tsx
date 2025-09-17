"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, Plus, Edit, Eye, Route, Star } from "lucide-react"

interface Trip {
  id: string
  title: string
  destination: string
  date: string
  status: "upcoming" | "current" | "completed"
  stops: string[]
  duration: string
}

interface TripsViewProps {
  user: any
}

export function TripsView({ user }: TripsViewProps) {
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: "1",
      title: "Shillong Heritage Tour",
      destination: "Shillong, Meghalaya",
      date: "2024-01-20",
      status: "completed",
      stops: ["Ward's Lake", "Don Bosco Museum", "Elephant Falls"],
      duration: "1 day",
    },
    {
      id: "2",
      title: "Cherrapunji Adventure",
      destination: "Cherrapunji, Meghalaya",
      date: "2024-01-25",
      status: "current",
      stops: ["Nohkalikai Falls", "Mawsmai Cave", "Seven Sisters Falls"],
      duration: "2 days",
    },
    {
      id: "3",
      title: "Kaziranga Wildlife Safari",
      destination: "Kaziranga, Assam",
      date: "2024-02-01",
      status: "upcoming",
      stops: ["Central Range", "Western Range", "Elephant Safari"],
      duration: "3 days",
    },
  ])

  const [showNewTrip, setShowNewTrip] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [newTripData, setNewTripData] = useState({
    destination: "",
    date: "",
    duration: "1",
  })

  const createNewTrip = () => {
    if (!newTripData.destination || !newTripData.date) return

    // Simulate AI trip planning
    const aiSuggestedStops = [
      "Local Museum",
      "Scenic Viewpoint",
      "Cultural Center",
      "Traditional Market",
      "Nature Trail",
    ]

    const newTrip: Trip = {
      id: Date.now().toString(),
      title: `${newTripData.destination} Adventure`,
      destination: newTripData.destination,
      date: newTripData.date,
      status: "upcoming",
      stops: aiSuggestedStops.slice(0, 3),
      duration: `${newTripData.duration} day${newTripData.duration !== "1" ? "s" : ""}`,
    }

    setTrips([...trips, newTrip])
    setNewTripData({ destination: "", date: "", duration: "1" })
    setShowNewTrip(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "current":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Star className="w-4 h-4" />
      case "current":
        return <Route className="w-4 h-4" />
      case "upcoming":
        return <Calendar className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  if (selectedTrip) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setSelectedTrip(null)} size="sm">
              ← Back
            </Button>
            <h1 className="text-xl font-bold">{selectedTrip.title}</h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Trip Details
                </CardTitle>
                <Badge className={getStatusColor(selectedTrip.status)}>
                  {getStatusIcon(selectedTrip.status)}
                  <span className="ml-1 capitalize">{selectedTrip.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Destination</p>
                  <p className="text-sm text-muted-foreground">{selectedTrip.destination}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{selectedTrip.duration}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">{selectedTrip.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Trip ID</p>
                  <p className="text-sm text-muted-foreground">{selectedTrip.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Planned Stops</CardTitle>
              <CardDescription>AI-suggested destinations and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedTrip.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{stop}</p>
                      <p className="text-sm text-muted-foreground">Recommended by AI</p>
                    </div>
                    {selectedTrip.status !== "completed" && (
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {selectedTrip.status !== "completed" && (
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Stop
                </Button>
              )}
            </CardContent>
          </Card>

          {selectedTrip.status === "current" && (
            <Card>
              <CardHeader>
                <CardTitle>Current Trip Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <Route className="w-4 h-4 mr-2" />
                  Navigate to Next Stop
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Edit className="w-4 h-4 mr-2" />
                  Modify Trip Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (showNewTrip) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowNewTrip(false)} size="sm">
              ← Back
            </Button>
            <h1 className="text-xl font-bold">Plan New Trip</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Trip Planner</CardTitle>
              <CardDescription>Let our AI suggest the best route and stops for your journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="Where do you want to go?"
                  value={newTripData.destination}
                  onChange={(e) => setNewTripData({ ...newTripData, destination: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Travel Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTripData.date}
                  onChange={(e) => setNewTripData({ ...newTripData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="30"
                  value={newTripData.duration}
                  onChange={(e) => setNewTripData({ ...newTripData, duration: e.target.value })}
                />
              </div>
              <Button onClick={createNewTrip} className="w-full">
                Generate AI Trip Plan
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
            <h1 className="text-2xl font-bold text-foreground">My Trips</h1>
            <p className="text-muted-foreground">AI-powered travel planning</p>
          </div>
          <Button onClick={() => setShowNewTrip(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Trip
          </Button>
        </div>

        {/* Trip Tabs */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {trips
              .filter((trip) => trip.status === "current")
              .map((trip) => (
                <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{trip.title}</h3>
                      <Badge className={getStatusColor(trip.status)}>
                        {getStatusIcon(trip.status)}
                        <span className="ml-1">In Progress</span>
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {trip.destination}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {trip.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {trip.duration}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => setSelectedTrip(trip)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        <Route className="w-3 h-3 mr-1" />
                        Navigate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {trips.filter((trip) => trip.status === "current").length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No current trips</p>
                  <Button onClick={() => setShowNewTrip(true)} className="mt-4">
                    Plan Your First Trip
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {trips
              .filter((trip) => trip.status === "upcoming")
              .map((trip) => (
                <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{trip.title}</h3>
                      <Badge className={getStatusColor(trip.status)}>
                        {getStatusIcon(trip.status)}
                        <span className="ml-1">Upcoming</span>
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {trip.destination}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {trip.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {trip.duration}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => setSelectedTrip(trip)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        <Edit className="w-3 h-3 mr-1" />
                        Modify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {trips
              .filter((trip) => trip.status === "completed")
              .map((trip) => (
                <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{trip.title}</h3>
                      <Badge className={getStatusColor(trip.status)}>
                        {getStatusIcon(trip.status)}
                        <span className="ml-1">Completed</span>
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {trip.destination}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {trip.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {trip.duration}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setSelectedTrip(trip)} className="mt-4">
                      <Eye className="w-3 h-3 mr-1" />
                      View Trip Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
