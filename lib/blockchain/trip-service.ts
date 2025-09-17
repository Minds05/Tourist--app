import { contractService } from "./contract-service"
import { walletService } from "./wallet-service"
import { ipfsClient } from "./ipfs-client"
import { didManager } from "./did-manager"

export interface BlockchainTrip {
  tripId: number
  tourist: string
  touristDID: string
  destination: string
  startDate: number
  endDate: number
  checkpoints: string[]
  checkpointTimestamps: number[]
  status: TripStatus
  safetyScore: number
  ipfsMetadata: string
  createdAt: number
  completedAt: number
}

export interface TripCheckpoint {
  location: string
  timestamp: number
  coordinates: string
  isVerified: boolean
  notes: string
}

export interface SafetyReport {
  reporter: string
  tripId: number
  reportType: string
  description: string
  location: string
  timestamp: number
  isResolved: boolean
}

export enum TripStatus {
  Planned = 0,
  Active = 1,
  Completed = 2,
  Cancelled = 3,
  Emergency = 4,
}

export class TripService {
  private static instance: TripService

  private constructor() {}

  static getInstance(): TripService {
    if (!TripService.instance) {
      TripService.instance = new TripService()
    }
    return TripService.instance
  }

  async createTrip(
    destination: string,
    startDate: Date,
    endDate: Date,
    plannedCheckpoints: string[],
    description?: string,
  ): Promise<number> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      // Create trip metadata
      const metadata = {
        description: description || "",
        plannedActivities: [],
        safetyGuidelines: [
          "Check in at each checkpoint",
          "Maintain communication with emergency contacts",
          "Follow local safety protocols",
          "Report any incidents immediately",
        ],
        emergencyContacts: [],
        createdBy: wallet.did.did,
        createdAt: Date.now(),
      }

      // Upload metadata to IPFS
      const ipfsHash = await ipfsClient.uploadJSON(metadata)

      // Create trip on blockchain
      const contract = await contractService.getTripVerificationContract()
      const tx = await contract.createTrip(
        wallet.did.did,
        destination,
        Math.floor(startDate.getTime() / 1000),
        Math.floor(endDate.getTime() / 1000),
        plannedCheckpoints,
        ipfsHash,
      )

      const receipt = await tx.wait()

      // Extract trip ID from events
      const tripCreatedEvent = receipt.events?.find((event: any) => event.event === "TripCreated")
      const tripId = tripCreatedEvent?.args?.tripId?.toNumber()

      if (!tripId) {
        throw new Error("Failed to get trip ID from transaction")
      }

      return tripId
    } catch (error) {
      console.error("Failed to create trip:", error)
      throw error
    }
  }

  async startTrip(tripId: number): Promise<void> {
    try {
      const contract = await contractService.getTripVerificationContract()
      const tx = await contract.startTrip(tripId)
      await tx.wait()
    } catch (error) {
      console.error("Failed to start trip:", error)
      throw error
    }
  }

  async reachCheckpoint(tripId: number, checkpointIndex: number, coordinates: string, notes: string): Promise<void> {
    try {
      const contract = await contractService.getTripVerificationContract()
      const tx = await contract.reachCheckpoint(tripId, checkpointIndex, coordinates, notes)
      await tx.wait()
    } catch (error) {
      console.error("Failed to reach checkpoint:", error)
      throw error
    }
  }

  async completeTrip(tripId: number): Promise<void> {
    try {
      const contract = await contractService.getTripVerificationContract()
      const tx = await contract.completeTrip(tripId)
      await tx.wait()

      // Create completion credential
      await this.createTripCompletionCredential(tripId)
    } catch (error) {
      console.error("Failed to complete trip:", error)
      throw error
    }
  }

  async declareEmergency(tripId: number, location: string, description: string): Promise<void> {
    try {
      const contract = await contractService.getTripVerificationContract()
      const tx = await contract.declareEmergency(tripId, location, description)
      await tx.wait()
    } catch (error) {
      console.error("Failed to declare emergency:", error)
      throw error
    }
  }

  async fileSafetyReport(tripId: number, reportType: string, description: string, location: string): Promise<void> {
    try {
      const contract = await contractService.getTripVerificationContract()
      const tx = await contract.fileSafetyReport(tripId, reportType, description, location)
      await tx.wait()
    } catch (error) {
      console.error("Failed to file safety report:", error)
      throw error
    }
  }

  async getTrip(tripId: number): Promise<BlockchainTrip> {
    try {
      const contract = await contractService.getTripVerificationContract()
      const tripData = await contract.getTrip(tripId)

      return {
        tripId: tripData.tripId.toNumber(),
        tourist: tripData.tourist,
        touristDID: tripData.touristDID,
        destination: tripData.destination,
        startDate: tripData.startDate.toNumber(),
        endDate: tripData.endDate.toNumber(),
        checkpoints: tripData.checkpoints,
        checkpointTimestamps: tripData.checkpointTimestamps.map((ts: any) => ts.toNumber()),
        status: tripData.status,
        safetyScore: tripData.safetyScore.toNumber(),
        ipfsMetadata: tripData.ipfsMetadata,
        createdAt: tripData.createdAt.toNumber(),
        completedAt: tripData.completedAt.toNumber(),
      }
    } catch (error) {
      console.error("Failed to get trip:", error)
      throw error
    }
  }

  async getUserTrips(): Promise<number[]> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        return []
      }

      const contract = await contractService.getTripVerificationContract()
      const tripIds = await contract.getUserTrips(wallet.address)
      return tripIds.map((id: any) => id.toNumber())
    } catch (error) {
      console.error("Failed to get user trips:", error)
      return []
    }
  }

  async getTripCheckpoints(tripId: number): Promise<TripCheckpoint[]> {
    try {
      const contract = await contractService.getTripVerificationContract()
      return await contract.getTripCheckpoints(tripId)
    } catch (error) {
      console.error("Failed to get trip checkpoints:", error)
      return []
    }
  }

  async getTripSafetyReports(tripId: number): Promise<SafetyReport[]> {
    try {
      const contract = await contractService.getTripVerificationContract()
      return await contract.getTripSafetyReports(tripId)
    } catch (error) {
      console.error("Failed to get trip safety reports:", error)
      return []
    }
  }

  async getTripMetadata(ipfsHash: string): Promise<any> {
    try {
      return await ipfsClient.retrieveJSON(ipfsHash)
    } catch (error) {
      console.error("Failed to get trip metadata:", error)
      return null
    }
  }

  async createTripCompletionCredential(tripId: number): Promise<any> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      const trip = await this.getTrip(tripId)

      const credential = await didManager.createTravelCredential(
        wallet.did.did, // Self-issued for now
        wallet.did.did,
        {
          destination: trip.destination,
          startDate: new Date(trip.startDate * 1000).toISOString(),
          endDate: new Date(trip.endDate * 1000).toISOString(),
          purpose: "Tourism",
          safetyScore: trip.safetyScore,
        },
      )

      await walletService.addCredential(credential)
      return credential
    } catch (error) {
      console.error("Failed to create trip completion credential:", error)
      throw error
    }
  }

  getStatusString(status: TripStatus): string {
    switch (status) {
      case TripStatus.Planned:
        return "planned"
      case TripStatus.Active:
        return "active"
      case TripStatus.Completed:
        return "completed"
      case TripStatus.Cancelled:
        return "cancelled"
      case TripStatus.Emergency:
        return "emergency"
      default:
        return "unknown"
    }
  }
}

export const tripService = TripService.getInstance()
