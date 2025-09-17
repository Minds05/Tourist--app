// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GroupManagement is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _groupIdCounter;
    
    struct TravelGroup {
        uint256 groupId;
        string name;
        address creator;
        string destination;
        uint256 startDate;
        uint256 endDate;
        uint256 maxMembers;
        uint256 currentMembers;
        bool isActive;
        string ipfsMetadata; // Group details, rules, etc.
        uint256 createdAt;
    }
    
    struct GroupMember {
        address memberAddress;
        string memberDID;
        uint256 joinedAt;
        bool isAdmin;
        bool isActive;
        string emergencyContact;
    }
    
    struct GroupMessage {
        address sender;
        string content;
        uint256 timestamp;
        bool isEmergency;
    }
    
    mapping(uint256 => TravelGroup) public groups;
    mapping(uint256 => mapping(address => GroupMember)) public groupMembers;
    mapping(uint256 => address[]) public groupMembersList;
    mapping(uint256 => GroupMessage[]) public groupMessages;
    mapping(address => uint256[]) public userGroups;
    mapping(string => uint256) public inviteCodeToGroupId;
    
    event GroupCreated(uint256 indexed groupId, address indexed creator, string name);
    event MemberJoined(uint256 indexed groupId, address indexed member, string memberDID);
    event MemberLeft(uint256 indexed groupId, address indexed member);
    event MessageSent(uint256 indexed groupId, address indexed sender, bool isEmergency);
    event EmergencyAlert(uint256 indexed groupId, address indexed sender, string location);
    event GroupDeactivated(uint256 indexed groupId);
    
    modifier onlyGroupMember(uint256 _groupId) {
        require(groupMembers[_groupId][msg.sender].isActive, "Not a group member");
        _;
    }
    
    modifier onlyGroupAdmin(uint256 _groupId) {
        require(groupMembers[_groupId][msg.sender].isAdmin, "Not a group admin");
        _;
    }
    
    modifier groupExists(uint256 _groupId) {
        require(groups[_groupId].groupId != 0, "Group does not exist");
        _;
    }
    
    function createGroup(
        string memory _name,
        string memory _destination,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _maxMembers,
        string memory _ipfsMetadata,
        string memory _creatorDID
    ) external nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Group name cannot be empty");
        require(_maxMembers > 0 && _maxMembers <= 50, "Invalid max members");
        require(_startDate > block.timestamp, "Start date must be in future");
        require(_endDate > _startDate, "End date must be after start date");
        
        _groupIdCounter.increment();
        uint256 groupId = _groupIdCounter.current();
        
        groups[groupId] = TravelGroup({
            groupId: groupId,
            name: _name,
            creator: msg.sender,
            destination: _destination,
            startDate: _startDate,
            endDate: _endDate,
            maxMembers: _maxMembers,
            currentMembers: 1,
            isActive: true,
            ipfsMetadata: _ipfsMetadata,
            createdAt: block.timestamp
        });
        
        // Add creator as admin member
        groupMembers[groupId][msg.sender] = GroupMember({
            memberAddress: msg.sender,
            memberDID: _creatorDID,
            joinedAt: block.timestamp,
            isAdmin: true,
            isActive: true,
            emergencyContact: ""
        });
        
        groupMembersList[groupId].push(msg.sender);
        userGroups[msg.sender].push(groupId);
        
        // Generate invite code (simplified)
        string memory inviteCode = generateInviteCode(groupId);
        inviteCodeToGroupId[inviteCode] = groupId;
        
        emit GroupCreated(groupId, msg.sender, _name);
        return groupId;
    }
    
    function joinGroup(
        uint256 _groupId,
        string memory _memberDID,
        string memory _emergencyContact
    ) external nonReentrant groupExists(_groupId) {
        TravelGroup storage group = groups[_groupId];
        require(group.isActive, "Group is not active");
        require(group.currentMembers < group.maxMembers, "Group is full");
        require(!groupMembers[_groupId][msg.sender].isActive, "Already a member");
        
        groupMembers[_groupId][msg.sender] = GroupMember({
            memberAddress: msg.sender,
            memberDID: _memberDID,
            joinedAt: block.timestamp,
            isAdmin: false,
            isActive: true,
            emergencyContact: _emergencyContact
        });
        
        groupMembersList[_groupId].push(msg.sender);
        userGroups[msg.sender].push(_groupId);
        group.currentMembers++;
        
        emit MemberJoined(_groupId, msg.sender, _memberDID);
    }
    
    function joinGroupByInviteCode(
        string memory _inviteCode,
        string memory _memberDID,
        string memory _emergencyContact
    ) external nonReentrant {
        uint256 groupId = inviteCodeToGroupId[_inviteCode];
        require(groupId != 0, "Invalid invite code");
        
        joinGroup(groupId, _memberDID, _emergencyContact);
    }
    
    function leaveGroup(uint256 _groupId) external nonReentrant onlyGroupMember(_groupId) {
        TravelGroup storage group = groups[_groupId];
        GroupMember storage member = groupMembers[_groupId][msg.sender];
        
        require(msg.sender != group.creator, "Creator cannot leave group");
        
        member.isActive = false;
        group.currentMembers--;
        
        // Remove from user groups
        uint256[] storage userGroupsList = userGroups[msg.sender];
        for (uint256 i = 0; i < userGroupsList.length; i++) {
            if (userGroupsList[i] == _groupId) {
                userGroupsList[i] = userGroupsList[userGroupsList.length - 1];
                userGroupsList.pop();
                break;
            }
        }
        
        emit MemberLeft(_groupId, msg.sender);
    }
    
    function sendMessage(
        uint256 _groupId,
        string memory _content,
        bool _isEmergency
    ) external onlyGroupMember(_groupId) {
        require(bytes(_content).length > 0, "Message cannot be empty");
        
        groupMessages[_groupId].push(GroupMessage({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            isEmergency: _isEmergency
        }));
        
        emit MessageSent(_groupId, msg.sender, _isEmergency);
        
        if (_isEmergency) {
            emit EmergencyAlert(_groupId, msg.sender, _content);
        }
    }
    
    function updateEmergencyContact(
        uint256 _groupId,
        string memory _emergencyContact
    ) external onlyGroupMember(_groupId) {
        groupMembers[_groupId][msg.sender].emergencyContact = _emergencyContact;
    }
    
    function promoteToAdmin(
        uint256 _groupId,
        address _member
    ) external onlyGroupAdmin(_groupId) {
        require(groupMembers[_groupId][_member].isActive, "Member not active");
        groupMembers[_groupId][_member].isAdmin = true;
    }
    
    function deactivateGroup(uint256 _groupId) external onlyGroupAdmin(_groupId) {
        groups[_groupId].isActive = false;
        emit GroupDeactivated(_groupId);
    }
    
    function getGroup(uint256 _groupId) external view returns (TravelGroup memory) {
        return groups[_groupId];
    }
    
    function getGroupMembers(uint256 _groupId) external view returns (address[] memory) {
        return groupMembersList[_groupId];
    }
    
    function getGroupMessages(uint256 _groupId) external view returns (GroupMessage[] memory) {
        return groupMessages[_groupId];
    }
    
    function getUserGroups(address _user) external view returns (uint256[] memory) {
        return userGroups[_user];
    }
    
    function generateInviteCode(uint256 _groupId) internal pure returns (string memory) {
        // Simplified invite code generation
        return string(abi.encodePacked("GRP", uint2str(_groupId)));
    }
    
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    function getTotalGroups() external view returns (uint256) {
        return _groupIdCounter.current();
    }
}
