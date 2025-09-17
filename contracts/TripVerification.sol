// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TripVerification is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tripIdCounter;
    
    struct Trip {
        uint256 tripId;
        address tourist;
        string touristDID;
        string destination;
        uint256 startDate;
        uint256 endDate;
        string[] checkpoints;
        uint256[] checkpointTimestamps;
        TripStatus status;
        uint256 safetyScore;
        string ipfsMetadata;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    struct Checkpoint {
        string location;
        uint256 timestamp;
        string coordinates;
        bool isVerified;
        string notes;
    }
    
    struct SafetyReport {
        address reporter;
        uint256 tripId;
        string reportType; // "incident", "safety_concern", "assistance_needed"
        string description;
        string location;
        uint256 timestamp;
        bool isResolved;
    }
    
    enum TripStatus {
        Planned,
        Active,
        Completed,
        Cancelled,
        Emergency
    }
    
    mapping(uint256 => Trip) public trips;
    mapping(uint256 => Checkpoint[]) public tripCheckpoints;
    mapping(uint256 => SafetyReport[]) public tripSafetyReports;
    mapping(address => uint256[]) public userTrips;
    mapping(string => uint256[]) public destinationTrips;
    
    event TripCreated(uint256 indexed tripId, address indexed tourist, string destination);
    event TripStarted(uint256 indexed tripId, address indexed tourist);
    event CheckpointReached(uint256 indexed tripId, string location, uint256 timestamp);
    event TripCompleted(uint256 indexed tripId, address indexed tourist, uint256 safetyScore);
    event SafetyReportFiled(uint256 indexed tripId, address indexed reporter, string reportType);
    event EmergencyDeclared(uint256 indexed tripId, address indexed tourist, string location);
    
    modifier onlyTripOwner(uint256 _tripId) {
        require(trips[_tripId].tourist == msg.sender, "Not trip owner");
        _;
    }
    
    modifier tripExists(uint256 _tripId) {
        require(trips[_tripId].tripId != 0, "Trip does not exist");
        _;
    }
    
    function createTrip(
        string memory _touristDID,
        string memory _destination,
        uint256 _startDate,
        uint256 _endDate,
        string[] memory _plannedCheckpoints,
        string memory _ipfsMetadata
    ) external nonReentrant returns (uint256) {
        require(bytes(_destination).length > 0, "Destination cannot be empty");
        require(_startDate > block.timestamp, "Start date must be in future");
        require(_endDate > _startDate, "End date must be after start date");
        require(_plannedCheckpoints.length > 0, "Must have at least one checkpoint");
        
        _tripIdCounter.increment();
        uint256 tripId = _tripIdCounter.current();
        
        trips[tripId] = Trip({
            tripId: tripId,
            tourist: msg.sender,
            touristDID: _touristDID,
            destination: _destination,
            startDate: _startDate,
            endDate: _endDate,
            checkpoints: _plannedCheckpoints,
            checkpointTimestamps: new uint256[](_plannedCheckpoints.length),
            status: TripStatus.Planned,
            safetyScore: 100,
            ipfsMetadata: _ipfsMetadata,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        userTrips[msg.sender].push(tripId);
        destinationTrips[_destination].push(tripId);
        
        emit TripCreated(tripId, msg.sender, _destination);
        return tripId;
    }
    
    function startTrip(uint256 _tripId) external onlyTripOwner(_tripId) tripExists(_tripId) {
        Trip storage trip = trips[_tripId];
        require(trip.status == TripStatus.Planned, "Trip already started or completed");
        require(block.timestamp >= trip.startDate, "Trip start date not reached");
        
        trip.status = TripStatus.Active;
        emit TripStarted(_tripId, msg.sender);
    }
    
    function reachCheckpoint(
        uint256 _tripId,
        uint256 _checkpointIndex,
        string memory _coordinates,
        string memory _notes
    ) external onlyTripOwner(_tripId) tripExists(_tripId) {
        Trip storage trip = trips[_tripId];
        require(trip.status == TripStatus.Active, "Trip not active");
        require(_checkpointIndex < trip.checkpoints.length, "Invalid checkpoint index");
        require(trip.checkpointTimestamps[_checkpointIndex] == 0, "Checkpoint already reached");
        
        trip.checkpointTimestamps[_checkpointIndex] = block.timestamp;
        
        tripCheckpoints[_tripId].push(Checkpoint({
            location: trip.checkpoints[_checkpointIndex],
            timestamp: block.timestamp,
            coordinates: _coordinates,
            isVerified: true,
            notes: _notes
        }));
        
        emit CheckpointReached(_tripId, trip.checkpoints[_checkpointIndex], block.timestamp);
        
        // Update safety score based on timely checkpoint completion
        updateSafetyScore(_tripId);
    }
    
    function completeTrip(uint256 _tripId) external onlyTripOwner(_tripId) tripExists(_tripId) {
        Trip storage trip = trips[_tripId];
        require(trip.status == TripStatus.Active, "Trip not active");
        
        trip.status = TripStatus.Completed;
        trip.completedAt = block.timestamp;
        
        // Calculate final safety score
        uint256 finalScore = calculateFinalSafetyScore(_tripId);
        trip.safetyScore = finalScore;
        
        emit TripCompleted(_tripId, msg.sender, finalScore);
    }
    
    function cancelTrip(uint256 _tripId) external onlyTripOwner(_tripId) tripExists(_tripId) {
        Trip storage trip = trips[_tripId];
        require(trip.status == TripStatus.Planned || trip.status == TripStatus.Active, "Cannot cancel completed trip");
        
        trip.status = TripStatus.Cancelled;
        emit TripCompleted(_tripId, msg.sender, trip.safetyScore);
    }
    
    function declareEmergency(
        uint256 _tripId,
        string memory _location,
        string memory _description
    ) external onlyTripOwner(_tripId) tripExists(_tripId) {
        Trip storage trip = trips[_tripId];
        require(trip.status == TripStatus.Active, "Trip not active");
        
        trip.status = TripStatus.Emergency;
        
        // File emergency safety report
        tripSafetyReports[_tripId].push(SafetyReport({
            reporter: msg.sender,
            tripId: _tripId,
            reportType: "emergency",
            description: _description,
            location: _location,
            timestamp: block.timestamp,
            isResolved: false
        }));
        
        emit EmergencyDeclared(_tripId, msg.sender, _location);
    }
    
    function fileSafetyReport(
        uint256 _tripId,
        string memory _reportType,
        string memory _description,
        string memory _location
    ) external tripExists(_tripId) {
        tripSafetyReports[_tripId].push(SafetyReport({
            reporter: msg.sender,
            tripId: _tripId,
            reportType: _reportType,
            description: _description,
            location: _location,
            timestamp: block.timestamp,
            isResolved: false
        }));
        
        emit SafetyReportFiled(_tripId, msg.sender, _reportType);
        
        // Reduce safety score for incidents
        if (keccak256(bytes(_reportType)) == keccak256(bytes("incident"))) {
            Trip storage trip = trips[_tripId];
            if (trip.safetyScore > 10) {
                trip.safetyScore -= 10;
            }
        }
    }
    
    function resolveSafetyReport(
        uint256 _tripId,
        uint256 _reportIndex
    ) external onlyOwner tripExists(_tripId) {
        require(_reportIndex < tripSafetyReports[_tripId].length, "Invalid report index");
        tripSafetyReports[_tripId][_reportIndex].isResolved = true;
    }
    
    function updateSafetyScore(uint256 _tripId) internal {
        Trip storage trip = trips[_tripId];
        
        // Calculate completed checkpoints
        uint256 completedCheckpoints = 0;
        for (uint256 i = 0; i < trip.checkpointTimestamps.length; i++) {
            if (trip.checkpointTimestamps[i] != 0) {
                completedCheckpoints++;
            }
        }
        
        // Bonus for completing checkpoints on time
        uint256 completionRate = (completedCheckpoints * 100) / trip.checkpoints.length;
        if (completionRate > 80 && trip.safetyScore < 100) {
            trip.safetyScore += 5;
            if (trip.safetyScore > 100) {
                trip.safetyScore = 100;
            }
        }
    }
    
    function calculateFinalSafetyScore(uint256 _tripId) internal view returns (uint256) {
        Trip storage trip = trips[_tripId];
        uint256 score = trip.safetyScore;
        
        // Bonus for completing all checkpoints
        uint256 completedCheckpoints = 0;
        for (uint256 i = 0; i < trip.checkpointTimestamps.length; i++) {
            if (trip.checkpointTimestamps[i] != 0) {
                completedCheckpoints++;
            }
        }
        
        if (completedCheckpoints == trip.checkpoints.length) {
            score += 10;
        }
        
        // Bonus for completing on time
        if (block.timestamp <= trip.endDate) {
            score += 5;
        }
        
        return score > 100 ? 100 : score;
    }
    
    function getTrip(uint256 _tripId) external view returns (Trip memory) {
        return trips[_tripId];
    }
    
    function getTripCheckpoints(uint256 _tripId) external view returns (Checkpoint[] memory) {
        return tripCheckpoints[_tripId];
    }
    
    function getTripSafetyReports(uint256 _tripId) external view returns (SafetyReport[] memory) {
        return tripSafetyReports[_tripId];
    }
    
    function getUserTrips(address _user) external view returns (uint256[] memory) {
        return userTrips[_user];
    }
    
    function getDestinationTrips(string memory _destination) external view returns (uint256[] memory) {
        return destinationTrips[_destination];
    }
    
    function getTotalTrips() external view returns (uint256) {
        return _tripIdCounter.current();
    }
}
