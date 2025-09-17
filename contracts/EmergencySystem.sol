// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EmergencySystem is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _emergencyIdCounter;
    
    struct EmergencyAlert {
        uint256 emergencyId;
        address tourist;
        string touristDID;
        EmergencyType emergencyType;
        string location;
        string coordinates;
        string description;
        uint256 timestamp;
        EmergencyStatus status;
        address[] responders;
        string[] responseActions;
        uint256 resolvedAt;
        string ipfsData; // Additional emergency data
    }
    
    struct EmergencyContact {
        string name;
        string phone;
        string relationship;
        string email;
        bool isVerified;
    }
    
    struct EmergencyResponder {
        address responderAddress;
        string name;
        string organization;
        string[] specializations;
        bool isActive;
        uint256 responseCount;
        uint256 averageResponseTime;
    }
    
    enum EmergencyType {
        Medical,
        Security,
        Natural,
        Accident,
        Lost,
        General
    }
    
    enum EmergencyStatus {
        Active,
        Acknowledged,
        InProgress,
        Resolved,
        Cancelled
    }
    
    mapping(uint256 => EmergencyAlert) public emergencies;
    mapping(address => EmergencyContact[]) public touristEmergencyContacts;
    mapping(address => EmergencyResponder) public emergencyResponders;
    mapping(address => uint256[]) public touristEmergencies;
    mapping(address => uint256[]) public responderEmergencies;
    
    address[] public activeResponders;
    
    event EmergencyDeclared(
        uint256 indexed emergencyId,
        address indexed tourist,
        EmergencyType emergencyType,
        string location
    );
    event EmergencyAcknowledged(uint256 indexed emergencyId, address indexed responder);
    event EmergencyResolved(uint256 indexed emergencyId, address indexed responder);
    event ResponderRegistered(address indexed responder, string name);
    event EmergencyContactAdded(address indexed tourist, string name);
    
    modifier onlyRegisteredResponder() {
        require(emergencyResponders[msg.sender].isActive, "Not a registered responder");
        _;
    }
    
    modifier emergencyExists(uint256 _emergencyId) {
        require(emergencies[_emergencyId].emergencyId != 0, "Emergency does not exist");
        _;
    }
    
    function declareEmergency(
        string memory _touristDID,
        EmergencyType _emergencyType,
        string memory _location,
        string memory _coordinates,
        string memory _description,
        string memory _ipfsData
    ) external nonReentrant returns (uint256) {
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        _emergencyIdCounter.increment();
        uint256 emergencyId = _emergencyIdCounter.current();
        
        emergencies[emergencyId] = EmergencyAlert({
            emergencyId: emergencyId,
            tourist: msg.sender,
            touristDID: _touristDID,
            emergencyType: _emergencyType,
            location: _location,
            coordinates: _coordinates,
            description: _description,
            timestamp: block.timestamp,
            status: EmergencyStatus.Active,
            responders: new address[](0),
            responseActions: new string[](0),
            resolvedAt: 0,
            ipfsData: _ipfsData
        });
        
        touristEmergencies[msg.sender].push(emergencyId);
        
        emit EmergencyDeclared(emergencyId, msg.sender, _emergencyType, _location);
        
        // Auto-notify nearby responders (simplified)
        notifyNearbyResponders(emergencyId);
        
        return emergencyId;
    }
    
    function acknowledgeEmergency(
        uint256 _emergencyId
    ) external onlyRegisteredResponder emergencyExists(_emergencyId) nonReentrant {
        EmergencyAlert storage emergency = emergencies[_emergencyId];
        require(emergency.status == EmergencyStatus.Active, "Emergency not active");
        
        // Check if responder already acknowledged
        for (uint256 i = 0; i < emergency.responders.length; i++) {
            require(emergency.responders[i] != msg.sender, "Already acknowledged");
        }
        
        emergency.responders.push(msg.sender);
        emergency.status = EmergencyStatus.Acknowledged;
        
        responderEmergencies[msg.sender].push(_emergencyId);
        
        emit EmergencyAcknowledged(_emergencyId, msg.sender);
    }
    
    function updateEmergencyStatus(
        uint256 _emergencyId,
        EmergencyStatus _status,
        string memory _action
    ) external onlyRegisteredResponder emergencyExists(_emergencyId) {
        EmergencyAlert storage emergency = emergencies[_emergencyId];
        
        // Check if responder is assigned to this emergency
        bool isAssigned = false;
        for (uint256 i = 0; i < emergency.responders.length; i++) {
            if (emergency.responders[i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        require(isAssigned, "Not assigned to this emergency");
        
        emergency.status = _status;
        emergency.responseActions.push(_action);
        
        if (_status == EmergencyStatus.Resolved) {
            emergency.resolvedAt = block.timestamp;
            
            // Update responder stats
            EmergencyResponder storage responder = emergencyResponders[msg.sender];
            responder.responseCount++;
            
            uint256 responseTime = block.timestamp - emergency.timestamp;
            responder.averageResponseTime = 
                (responder.averageResponseTime * (responder.responseCount - 1) + responseTime) / 
                responder.responseCount;
            
            emit EmergencyResolved(_emergencyId, msg.sender);
        }
    }
    
    function cancelEmergency(uint256 _emergencyId) external emergencyExists(_emergencyId) {
        EmergencyAlert storage emergency = emergencies[_emergencyId];
        require(emergency.tourist == msg.sender, "Not emergency creator");
        require(emergency.status != EmergencyStatus.Resolved, "Emergency already resolved");
        
        emergency.status = EmergencyStatus.Cancelled;
    }
    
    function registerEmergencyResponder(
        string memory _name,
        string memory _organization,
        string[] memory _specializations
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(!emergencyResponders[msg.sender].isActive, "Already registered");
        
        emergencyResponders[msg.sender] = EmergencyResponder({
            responderAddress: msg.sender,
            name: _name,
            organization: _organization,
            specializations: _specializations,
            isActive: true,
            responseCount: 0,
            averageResponseTime: 0
        });
        
        activeResponders.push(msg.sender);
        
        emit ResponderRegistered(msg.sender, _name);
    }
    
    function addEmergencyContact(
        string memory _name,
        string memory _phone,
        string memory _relationship,
        string memory _email
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_phone).length > 0, "Phone cannot be empty");
        
        touristEmergencyContacts[msg.sender].push(EmergencyContact({
            name: _name,
            phone: _phone,
            relationship: _relationship,
            email: _email,
            isVerified: false
        }));
        
        emit EmergencyContactAdded(msg.sender, _name);
    }
    
    function verifyEmergencyContact(
        address _tourist,
        uint256 _contactIndex
    ) external onlyOwner {
        require(_contactIndex < touristEmergencyContacts[_tourist].length, "Invalid contact index");
        touristEmergencyContacts[_tourist][_contactIndex].isVerified = true;
    }
    
    function notifyNearbyResponders(uint256 _emergencyId) internal {
        // Simplified notification - in reality, this would use location-based filtering
        // For now, notify all active responders
        EmergencyAlert storage emergency = emergencies[_emergencyId];
        
        // This would typically trigger off-chain notifications
        // For demonstration, we'll just emit an event
        for (uint256 i = 0; i < activeResponders.length; i++) {
            if (emergencyResponders[activeResponders[i]].isActive) {
                // In a real implementation, this would trigger push notifications
                // or other communication mechanisms
            }
        }
    }
    
    function getEmergency(uint256 _emergencyId) external view returns (EmergencyAlert memory) {
        return emergencies[_emergencyId];
    }
    
    function getTouristEmergencies(address _tourist) external view returns (uint256[] memory) {
        return touristEmergencies[_tourist];
    }
    
    function getResponderEmergencies(address _responder) external view returns (uint256[] memory) {
        return responderEmergencies[_responder];
    }
    
    function getTouristEmergencyContacts(address _tourist) external view returns (EmergencyContact[] memory) {
        return touristEmergencyContacts[_tourist];
    }
    
    function getActiveResponders() external view returns (address[] memory) {
        return activeResponders;
    }
    
    function getEmergencyResponder(address _responder) external view returns (EmergencyResponder memory) {
        return emergencyResponders[_responder];
    }
    
    function getTotalEmergencies() external view returns (uint256) {
        return _emergencyIdCounter.current();
    }
    
    function getActiveEmergencies() external view returns (uint256[] memory) {
        uint256 totalEmergencies = _emergencyIdCounter.current();
        uint256[] memory activeEmergencies = new uint256[](totalEmergencies);
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= totalEmergencies; i++) {
            if (emergencies[i].status == EmergencyStatus.Active || 
                emergencies[i].status == EmergencyStatus.Acknowledged ||
                emergencies[i].status == EmergencyStatus.InProgress) {
                activeEmergencies[activeCount] = i;
                activeCount++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeEmergencies[i];
        }
        
        return result;
    }
}
