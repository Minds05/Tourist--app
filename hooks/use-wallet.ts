"use client"

import { useState, useEffect } from "react"
import { walletService, type WalletConnection, type TouristWallet } from "@/lib/blockchain/wallet-service"

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [wallet, setWallet] = useState<TouristWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize wallet state
    const currentWallet = walletService.getCurrentWallet()
    setWallet(currentWallet)

    // Listen for connection changes
    const unsubscribe = walletService.onConnectionChange((newConnection) => {
      setConnection(newConnection)

      if (newConnection?.did) {
        const currentWallet = walletService.getCurrentWallet()
        setWallet(currentWallet)
      } else {
        setWallet(null)
      }
    })

    setIsLoading(false)

    return unsubscribe
  }, [])

  const connectWallet = async () => {
    try {
      const connection = await walletService.connectWallet()
      return connection
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    }
  }

  const createWallet = async (alias: string, password: string) => {
    try {
      const wallet = await walletService.createTouristWallet(alias, password)
      setWallet(wallet)
      return wallet
    } catch (error) {
      console.error("Failed to create wallet:", error)
      throw error
    }
  }

  const loadWallet = async (address: string, password: string) => {
    try {
      const wallet = await walletService.loadWallet(address, password)
      setWallet(wallet)
      return wallet
    } catch (error) {
      console.error("Failed to load wallet:", error)
      throw error
    }
  }

  const disconnectWallet = async () => {
    try {
      await walletService.disconnectWallet()
      setConnection(null)
      setWallet(null)
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
      throw error
    }
  }

  const signMessage = async (message: string) => {
    try {
      return await walletService.signMessage(message)
    } catch (error) {
      console.error("Failed to sign message:", error)
      throw error
    }
  }

  const addCredential = async (credential: any) => {
    try {
      await walletService.addCredential(credential)
      // Update local wallet state
      const updatedWallet = walletService.getCurrentWallet()
      setWallet(updatedWallet)
    } catch (error) {
      console.error("Failed to add credential:", error)
      throw error
    }
  }

  const getCredentials = async () => {
    try {
      return await walletService.getCredentials()
    } catch (error) {
      console.error("Failed to get credentials:", error)
      return []
    }
  }

  return {
    connection,
    wallet,
    isLoading,
    isConnected: !!connection?.isConnected,
    hasDID: !!connection?.did,
    connectWallet,
    createWallet,
    loadWallet,
    disconnectWallet,
    signMessage,
    addCredential,
    getCredentials,
  }
}
