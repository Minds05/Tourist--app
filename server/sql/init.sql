-- PostgreSQL schema for Tourist Protection DID System
-- Run this script to initialize the database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    did VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone_number VARCHAR(20),
    nationality VARCHAR(100),
    date_of_birth DATE,
    profile_image TEXT,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_ipfs_cid VARCHAR(255),
    kyc_verification_level INTEGER DEFAULT 0 CHECK (kyc_verification_level >= 0 AND kyc_verification_level <= 3),
    kyc_submitted_at TIMESTAMP,
    kyc_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_members INTEGER NOT NULL CHECK (max_members >= 2 AND max_members <= 50),
    current_members INTEGER DEFAULT 1 CHECK (current_members >= 0),
    creator VARCHAR(42) NOT NULL,
    contract_address VARCHAR(42),
    push_channel_address VARCHAR(255),
    metadata_ipfs_cid VARCHAR(255),
    image_url TEXT,
    min_kyc_level INTEGER DEFAULT 1 CHECK (min_kyc_level >= 0 AND min_kyc_level <= 3),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    local_emergency_number VARCHAR(20),
    embassy_contact VARCHAR(255),
    hospital_contact VARCHAR(255),
    police_contact VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    did VARCHAR(255),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    nft_token_id VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    UNIQUE(group_id, wallet_address)
);

-- Credentials table
CREATE TABLE IF NOT EXISTS credentials (
    id SERIAL PRIMARY KEY,
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    user_wallet_address VARCHAR(42) NOT NULL,
    type VARCHAR(100) NOT NULL,
    ipfs_cid VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    FOREIGN KEY (user_wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_wallet_address VARCHAR(42) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- KYC submissions table (for tracking verification process)
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id SERIAL PRIMARY KEY,
    user_wallet_address VARCHAR(42) NOT NULL,
    ipfs_cid VARCHAR(255) NOT NULL,
    verification_level INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    FOREIGN KEY (user_wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_did ON users(did);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator);
CREATE INDEX IF NOT EXISTS idx_groups_destination ON groups(destination);
CREATE INDEX IF NOT EXISTS idx_groups_dates ON groups(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_wallet ON group_members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
