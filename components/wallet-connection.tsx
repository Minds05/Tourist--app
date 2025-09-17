"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Wallet, Shield, Key, CheckCircle, AlertCircle } from "lucide-react"
import {
  walletService,
  type WalletConnection as WalletConnectionType,
  type TouristWallet,
} from "@/lib/blockchain/wallet-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WalletConnectionProps {
  onWalletConnected?: (wallet: TouristWallet) => void
}

export function WalletConnector({ onWalletConnected }: WalletConnectionProps) {
  const [connection, setConnection] = useState<WalletConnectionType | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showCreateWallet, setShowCreateWallet] = useState(false)
  const [showLoadWallet, setShowLoadWallet] = useState(false)
  const [alias, setAlias] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Listen for wallet connection changes
    const unsubscribe = walletService.onConnectionChange((newConnection) => {
      setConnection(newConnection)
    })

    return unsubscribe
  }, [])

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const walletConnection = await walletService.connectWallet()
      setConnection(walletConnection)

      if (!walletConnection.did) {
        // No DID found, show options to create or load
        setShowCreateWallet(true)
      }
    } catch (error: any) {
      setError(error.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCreateWallet = async () => {
    if (!alias.trim() || !password.trim()) {
      setError("Please provide both alias and password")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const wallet = await walletService.createTouristWallet(alias, password)

      // Store password in session for convenience (not secure for production)
      sessionStorage.setItem("wallet_password", password)

      setShowCreateWallet(false)
      onWalletConnected?.(wallet)
    } catch (error: any) {
      setError(error.message || "Failed to create wallet")
    } finally {
      setIsCreating(false)
    }
  }

  const handleLoadWallet = async () => {
    if (!password.trim() || !connection?.address) {
      setError("Please provide password")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const wallet = await walletService.loadWallet(connection.address, password)

      // Store password in session for convenience (not secure for production)
      sessionStorage.setItem("wallet_password", password)

      setShowLoadWallet(false)
      onWalletConnected?.(wallet)
    } catch (error: any) {
      setError(error.message || "Failed to load wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await walletService.disconnectWallet()
      setConnection(null)
      setShowCreateWallet(false)
      setShowLoadWallet(false)
      sessionStorage.removeItem("wallet_password")
    } catch (error: any) {
      setError(error.message || "Failed to disconnect wallet")
    }
  }

  if (!connection) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>Connect your Web3 wallet to access blockchain-based identity features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleConnectWallet} disabled={isConnecting} className="w-full">
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (showCreateWallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
            <Key className="h-6 w-6 text-secondary" />
          </div>
          <CardTitle>Create Tourist Identity</CardTitle>
          <CardDescription>Create your decentralized identity for secure travel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="alias">Identity Alias</Label>
            <Input
              id="alias"
              placeholder="e.g., john-tourist-2024"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Secure Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateWallet} disabled={isCreating} className="flex-1">
              {isCreating ? "Creating..." : "Create Identity"}
            </Button>
            <Button variant="outline" onClick={() => setShowLoadWallet(true)} className="flex-1">
              Load Existing
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showLoadWallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <CardTitle>Load Tourist Identity</CardTitle>
          <CardDescription>Enter your password to access your existing identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="load-password">Password</Label>
            <Input
              id="load-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleLoadWallet} disabled={isLoading} className="flex-1">
              {isLoading ? "Loading..." : "Load Identity"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateWallet(true)} className="flex-1">
              Create New
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle>Wallet Connected</CardTitle>
        <CardDescription>Your blockchain identity is ready</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Address:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {connection.address.slice(0, 6)}...{connection.address.slice(-4)}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Network:</span>
            <Badge variant="secondary">
              {connection.chainId === 11155111 ? "Sepolia" : `Chain ${connection.chainId}`}
            </Badge>
          </div>

          {connection.did && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">DID:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {connection.did.did.slice(0, 20)}...
              </Badge>
            </div>
          )}
        </div>

        <Button onClick={handleDisconnect} variant="outline" className="w-full bg-transparent">
          Disconnect
        </Button>
      </CardContent>
    </Card>
  )
}
