import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  walletAddress: string
  did?: string
  profile: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    nationality?: string
    dateOfBirth?: Date
    profileImage?: string
  }
  kycStatus: "pending" | "verified" | "rejected"
  kycData?: {
    ipfsCid?: string
    verificationLevel: number
    submittedAt?: Date
    verifiedAt?: Date
  }
  credentials: Array<{
    credentialId: string
    type: string
    ipfsCid: string
    issuedAt: Date
    status: "active" | "revoked"
  }>
  groups: Array<{
    groupId: string
    role: "member" | "admin"
    joinedAt: Date
  }>
  emergencyContacts: Array<{
    name: string
    phoneNumber: string
    relationship: string
  }>
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    did: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    profile: {
      firstName: String,
      lastName: String,
      email: {
        type: String,
        lowercase: true,
        sparse: true,
      },
      phoneNumber: String,
      nationality: String,
      dateOfBirth: Date,
      profileImage: String,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    kycData: {
      ipfsCid: String,
      verificationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 3,
      },
      submittedAt: Date,
      verifiedAt: Date,
    },
    credentials: [
      {
        credentialId: { type: String, required: true },
        type: { type: String, required: true },
        ipfsCid: { type: String, required: true },
        issuedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["active", "revoked"],
          default: "active",
        },
      },
    ],
    groups: [
      {
        groupId: { type: String, required: true },
        role: {
          type: String,
          enum: ["member", "admin"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    emergencyContacts: [
      {
        name: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        relationship: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
UserSchema.index({ "credentials.credentialId": 1 })
UserSchema.index({ "groups.groupId": 1 })
UserSchema.index({ kycStatus: 1 })

export const User = mongoose.model<IUser>("User", UserSchema)
