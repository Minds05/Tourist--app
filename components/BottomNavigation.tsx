import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface BottomNavigationProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    { id: "home", icon: "home", label: "Home" },
    { id: "maps", icon: "map", label: "Maps" },
    { id: "sos", icon: "warning", label: "SOS" },
    { id: "trips", icon: "navigate", label: "Trips" },
    { id: "groups", icon: "people", label: "Groups" },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {navItems.map((item) => {
          const isActive = currentView === item.id
          const isSOS = item.id === "sos"

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tabItem, isActive && styles.activeTab, isSOS && styles.sosTab]}
              onPress={() => onViewChange(item.id)}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={isSOS ? "#EF4444" : isActive ? "#6366F1" : "#9CA3AF"}
              />
              <Text style={[styles.tabLabel, { color: isSOS ? "#EF4444" : isActive ? "#6366F1" : "#9CA3AF" }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  tabItem: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#F3F4F6",
  },
  sosTab: {
    backgroundColor: "#FEF2F2",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
})
