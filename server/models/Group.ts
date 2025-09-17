import mongoose, { type Document, Schema } from "mongoose"

export interface IGroup extends Document {
  groupId: string
  name: string
  description: string
  destination: string
  startDate: Date
  endDate: Date
  maxMembers: number
  currentMembers: number
  creator: string // wallet address
  contractAddress?: string // GroupMembershipNFT contract
  pushChannelAddress?: string // Push Protocol channel
  metadata: {
    ipfsCid?: string
    imageUrl?: string
    tags: string[]
    requirements: {
      minKycLevel: number
      ageRestriction?: {
        min?: number
        max?: number
      }
      nationalityRestrictions?: string[]
    }
  }
  members: Array<{
    walletAddress: string
    did?: string
    role: "member" | "admin"
    joinedAt: Date
    nftTokenId?: string
  }>
  status: "active" | "completed" | "cancelled"
  emergencyInfo: {
    localEmergencyNumber?: string
    embassyContact?: string
    hospitalContact?: string
    policeContact?: string
  }
  createdAt: Date
  updatedAt: Date
}

const GroupSchema = new Schema<IGroup>(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxMembers: {
      type: Number,
      required: true,
      min: 2,
      max: 50,
    },
    currentMembers: {
      type: Number,
      default: 1,
      min: 0,
    },
    creator: {
      type: String,
      required: true,
      lowercase: true,
    },
    contractAddress: String,
    pushChannelAddress: String,
    metadata: {
      ipfsCid: String,
      imageUrl: String,
      tags: [String],
      requirements: {
        minKycLevel: {
          type: Number,
          default: 1,
          min: 0,
          max: 3,
        },
        ageRestriction: {
          min: Number,
          max: Number,
        },
        nationalityRestrictions: [String],
      },
    },
    members: [
      {
        walletAddress: {
          type: String,
          required: true,
          lowercase: true,
        },
        did: String,
        role: {
          type: String,
          enum: ["member", "admin"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        nftTokenId: String,
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    emergencyInfo: {
      localEmergencyNumber: String,
      embassyContact: String,
      hospitalContact: String,
      policeContact: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
GroupSchema.index({ creator: 1 })
GroupSchema.index({ "members.walletAddress": 1 })
GroupSchema.index({ destination: 1 })
GroupSchema.index({ startDate: 1, endDate: 1 })
GroupSchema.index({ status: 1 })

export const Group = mongoose.model<IGroup>("Group", GroupSchema)
