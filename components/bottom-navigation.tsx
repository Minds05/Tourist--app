"use client"

import { Home, Map, AlertTriangle, Route, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BottomNavigationProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "maps", icon: Map, label: "Maps" },
    { id: "sos", icon: AlertTriangle, label: "SOS" },
    { id: "trips", icon: Route, label: "Trips" },
    { id: "groups", icon: Users, label: "Groups" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          const isSOS = item.id === "sos"

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isSOS ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
