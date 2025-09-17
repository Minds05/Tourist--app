// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TouristIdentity is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _touristIdCounter;
    
    struct TouristProfile {
        string did; // Decentralized Identifier
        string ipfsHash; // IPFS hash of encrypted KYC data
        uint256 registrationTimestamp;
        bool isVerified;
        bool isActive;
        string emergencyContactDID;
        uint256 safetyScore;
    }
    
    struct VerificationRequest {
        address tourist;
        string ipfsHash;
        uint256 timestamp;
        bool isProcessed;
        bool isApproved;
    }
    
    mapping(address => TouristProfile) public tourists;
    mapping(string => address) public didToAddress;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    mapping(address => bool) public authorizedVerifiers;
    
    Counters.Counter private _verificationRequestCounter;
    
    event TouristRegistered(address indexed tourist, string did, uint256 touristId);
    event KYCSubmitted(address indexed tourist, string ipfsHash, uint256 requestId);
    event TouristVerified(address indexed tourist, bool isVerified);
    event SafetyScoreUpdated(address indexed tourist, uint256 newScore);
    event EmergencyContactUpdated(address indexed tourist, string emergencyContactDID);
    
    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier onlyRegisteredTourist() {
        require(bytes(tourists[msg.sender].did).length > 0, "Tourist not registered");
        _;
    }
    
    constructor() {
        authorizedVerifiers[msg.sender] = true;
    }
    
    function registerTourist(string memory _did, string memory _ipfsHash) external nonReentrant {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(bytes(tourists[msg.sender].did).length == 0, "Tourist already registered");
        require(didToAddress[_did] == address(0), "DID already exists");
        
        _touristIdCounter.increment();
        uint256 touristId = _touristIdCounter.current();
        
        tourists[msg.sender] = TouristProfile({
            did: _did,
            ipfsHash: _ipfsHash,
            registrationTimestamp: block.timestamp,
            isVerified: false,
            isActive: true,
            emergencyContactDID: "",
            safetyScore: 100
        });
        
        didToAddress[_did] = msg.sender;
        
        emit TouristRegistered(msg.sender, _did, touristId);
        
        if (bytes(_ipfsHash).length > 0) {
            submitKYC(_ipfsHash);
        }
    }
    
    function submitKYC(string memory _ipfsHash) public onlyRegisteredTourist nonReentrant {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        _verificationRequestCounter.increment();
        uint256 requestId = _verificationRequestCounter.current();
        
        verificationRequests[requestId] = VerificationRequest({
            tourist: msg.sender,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            isProcessed: false,
            isApproved: false
        });
        
        tourists[msg.sender].ipfsHash = _ipfsHash;
        
        emit KYCSubmitted(msg.sender, _ipfsHash, requestId);
    }
    
    function verifyTourist(uint256 _requestId, bool _isApproved) external onlyVerifier nonReentrant {
        VerificationRequest storage request = verificationRequests[_requestId];
        require(!request.isProcessed, "Request already processed");
        require(request.tourist != address(0), "Invalid request");
        
        request.isProcessed = true;
        request.isApproved = _isApproved;
        
        tourists[request.tourist].isVerified = _isApproved;
        
        emit TouristVerified(request.tourist, _isApproved);
    }
    
    function updateSafetyScore(address _tourist, uint256 _newScore) external onlyVerifier {
        require(_newScore <= 100, "Score cannot exceed 100");
        require(bytes(tourists[_tourist].did).length > 0, "Tourist not registered");
        
        tourists[_tourist].safetyScore = _newScore;
        emit SafetyScoreUpdated(_tourist, _newScore);
    }
    
    function setEmergencyContact(string memory _emergencyContactDID) external onlyRegisteredTourist {
        tourists[msg.sender].emergencyContactDID = _emergencyContactDID;
        emit EmergencyContactUpdated(msg.sender, _emergencyContactDID);
    }
    
    function deactivateTourist() external onlyRegisteredTourist {
        tourists[msg.sender].isActive = false;
    }
    
    function addVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = true;
    }
    
    function removeVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
    }
    
    function getTouristProfile(address _tourist) external view returns (TouristProfile memory) {
        return tourists[_tourist];
    }
    
    function getTouristByDID(string memory _did) external view returns (address) {
        return didToAddress[_did];
    }
    
    function getTotalTourists() external view returns (uint256) {
        return _touristIdCounter.current();
    }
    
    function getTotalVerificationRequests() external view returns (uint256) {
        return _verificationRequestCounter.current();
    }
}
