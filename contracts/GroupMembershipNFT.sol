// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GroupMembershipNFT
 * @dev ERC721 NFT representing membership in a travel group
 * @notice Each NFT represents membership in a specific travel group with role-based access
 */
contract GroupMembershipNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    AccessControl, 
    ReentrancyGuard 
{
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Group information
    struct GroupInfo {
        string groupId;
        string groupName;
        string destination;
        uint256 startDate;
        uint256 endDate;
        uint256 maxMembers;
        address creator;
        string metadataURI;
        bool isActive;
    }

    // Member information
    struct MemberInfo {
        address memberAddress;
        string did;
        string role; // "member" or "admin"
        uint256 joinedAt;
        bool isActive;
    }

    // State variables
    Counters.Counter private _tokenIdCounter;
    GroupInfo public groupInfo;
    
    // Mappings
    mapping(uint256 => MemberInfo) public memberInfo;
    mapping(address => uint256) public addressToTokenId;
    mapping(address => bool) public isMember;
    
    // Arrays for enumeration
    address[] public members;
    address[] public admins;

    // Events
    event MemberAdded(
        address indexed member,
        uint256 indexed tokenId,
        string role,
        uint256 timestamp
    );
    
    event MemberRemoved(
        address indexed member,
        uint256 indexed tokenId,
        uint256 timestamp
    );
    
    event RoleChanged(
        address indexed member,
        uint256 indexed tokenId,
        string oldRole,
        string newRole,
        uint256 timestamp
    );
    
    event GroupDeactivated(uint256 timestamp);
    event GroupReactivated(uint256 timestamp);

    constructor(
        string memory _groupId,
        string memory _groupName,
        string memory _destination,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _maxMembers,
        address _creator,
        string memory _metadataURI
    ) ERC721(
        string(abi.encodePacked("TouristGroup-", _groupName)), 
        string(abi.encodePacked("TG-", _groupId))
    ) {
        require(bytes(_groupId).length > 0, "Group ID cannot be empty");
        require(bytes(_groupName).length > 0, "Group name cannot be empty");
        require(_startDate > block.timestamp, "Start date must be in future");
        require(_endDate > _startDate, "End date must be after start date");
        require(_maxMembers >= 2 && _maxMembers <= 50, "Invalid max members");
        require(_creator != address(0), "Invalid creator address");

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _creator);
        _grantRole(ADMIN_ROLE, _creator);
        _grantRole(MINTER_ROLE, _creator);

        // Initialize group info
        groupInfo = GroupInfo({
            groupId: _groupId,
            groupName: _groupName,
            destination: _destination,
            startDate: _startDate,
            endDate: _endDate,
            maxMembers: _maxMembers,
            creator: _creator,
            metadataURI: _metadataURI,
            isActive: true
        });

        // Mint NFT for creator as admin
        _mintMembership(_creator, "", "admin");
    }

    /**
     * @dev Mint membership NFT for a new member
     * @param _to Address to mint NFT to
     * @param _did DID of the member
     * @param _role Role of the member ("member" or "admin")
     */
    function safeMint(
        address _to,
        string memory _did,
        string memory _role
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(_to != address(0), "Cannot mint to zero address");
        require(!isMember[_to], "Address already has membership");
        require(
            keccak256(bytes(_role)) == keccak256(bytes("member")) ||
            keccak256(bytes(_role)) == keccak256(bytes("admin")),
            "Invalid role"
        );
        require(groupInfo.isActive, "Group is not active");
        require(totalSupply() < groupInfo.maxMembers, "Group is full");

        _mintMembership(_to, _did, _role);
    }

    /**
     * @dev Internal function to mint membership NFT
     * @param _to Address to mint NFT to
     * @param _did DID of the member
     * @param _role Role of the member
     */
    function _mintMembership(
        address _to,
        string memory _did,
        string memory _role
    ) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, groupInfo.metadataURI);

        // Set member info
        memberInfo[tokenId] = MemberInfo({
            memberAddress: _to,
            did: _did,
            role: _role,
            joinedAt: block.timestamp,
            isActive: true
        });

        // Update mappings
        addressToTokenId[_to] = tokenId;
        isMember[_to] = true;
        members.push(_to);

        if (keccak256(bytes(_role)) == keccak256(bytes("admin"))) {
            admins.push(_to);
            _grantRole(ADMIN_ROLE, _to);
        }

        emit MemberAdded(_to, tokenId, _role, block.timestamp);
    }

    /**
     * @dev Remove member from group (burn NFT)
     * @param _member Address of member to remove
     */
    function removeMember(address _member) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        require(isMember[_member], "Address is not a member");
        require(_member != groupInfo.creator, "Cannot remove group creator");

        uint256 tokenId = addressToTokenId[_member];
        string memory role = memberInfo[tokenId].role;

        // Remove from role-specific arrays
        if (keccak256(bytes(role)) == keccak256(bytes("admin"))) {
            _removeFromAdmins(_member);
            _revokeRole(ADMIN_ROLE, _member);
        }
        _removeFromMembers(_member);

        // Update mappings
        memberInfo[tokenId].isActive = false;
        delete addressToTokenId[_member];
        isMember[_member] = false;

        // Burn NFT
        _burn(tokenId);

        emit MemberRemoved(_member, tokenId, block.timestamp);
    }

    /**
     * @dev Change member role
     * @param _member Address of member
     * @param _newRole New role ("member" or "admin")
     */
    function changeRole(
        address _member,
        string memory _newRole
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(isMember[_member], "Address is not a member");
        require(_member != groupInfo.creator, "Cannot change creator role");
        require(
            keccak256(bytes(_newRole)) == keccak256(bytes("member")) ||
            keccak256(bytes(_newRole)) == keccak256(bytes("admin")),
            "Invalid role"
        );

        uint256 tokenId = addressToTokenId[_member];
        string memory oldRole = memberInfo[tokenId].role;

        require(
            keccak256(bytes(oldRole)) != keccak256(bytes(_newRole)),
            "Member already has this role"
        );

        // Update role
        memberInfo[tokenId].role = _newRole;

        // Handle role-specific permissions
        if (keccak256(bytes(_newRole)) == keccak256(bytes("admin"))) {
            // Promote to admin
            admins.push(_member);
            _grantRole(ADMIN_ROLE, _member);
        } else {
            // Demote from admin
            _removeFromAdmins(_member);
            _revokeRole(ADMIN_ROLE, _member);
        }

        emit RoleChanged(_member, tokenId, oldRole, _newRole, block.timestamp);
    }

    /**
     * @dev Deactivate group
     */
    function deactivateGroup() external onlyRole(ADMIN_ROLE) {
        require(groupInfo.isActive, "Group already deactivated");
        groupInfo.isActive = false;
        emit GroupDeactivated(block.timestamp);
    }

    /**
     * @dev Reactivate group
     */
    function reactivateGroup() external onlyRole(ADMIN_ROLE) {
        require(!groupInfo.isActive, "Group already active");
        require(block.timestamp < groupInfo.endDate, "Group has expired");
        groupInfo.isActive = true;
        emit GroupReactivated(block.timestamp);
    }

    /**
     * @dev Update group metadata URI
     * @param _newMetadataURI New metadata URI
     */
    function updateMetadataURI(string memory _newMetadataURI) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(bytes(_newMetadataURI).length > 0, "Metadata URI cannot be empty");
        groupInfo.metadataURI = _newMetadataURI;

        // Update all token URIs
        for (uint256 i = 0; i < totalSupply(); i++) {
            uint256 tokenId = tokenByIndex(i);
            _setTokenURI(tokenId, _newMetadataURI);
        }
    }

    /**
     * @dev Get member information by address
     * @param _member Member address
     * @return Member information
     */
    function getMemberInfo(address _member)
        external
        view
        returns (
            uint256 tokenId,
            string memory did,
            string memory role,
            uint256 joinedAt,
            bool isActive
        )
    {
        require(isMember[_member], "Address is not a member");
        
        tokenId = addressToTokenId[_member];
        MemberInfo memory info = memberInfo[tokenId];
        
        return (tokenId, info.did, info.role, info.joinedAt, info.isActive);
    }

    /**
     * @dev Get all members
     * @return Array of member addresses
     */
    function getAllMembers() external view returns (address[] memory) {
        return members;
    }

    /**
     * @dev Get all admins
     * @return Array of admin addresses
     */
    function getAllAdmins() external view returns (address[] memory) {
        return admins;
    }

    /**
     * @dev Check if group has expired
     * @return True if group has expired
     */
    function hasExpired() external view returns (bool) {
        return block.timestamp > groupInfo.endDate;
    }

    /**
     * @dev Get available slots
     * @return Number of available membership slots
     */
    function getAvailableSlots() external view returns (uint256) {
        uint256 current = totalSupply();
        return current < groupInfo.maxMembers ? groupInfo.maxMembers - current : 0;
    }

    /**
     * @dev Internal function to remove member from members array
     * @param _member Member address to remove
     */
    function _removeFromMembers(address _member) internal {
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == _member) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
    }

    /**
     * @dev Internal function to remove admin from admins array
     * @param _admin Admin address to remove
     */
    function _removeFromAdmins(address _admin) internal {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                break;
            }
        }
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        // Prevent transfers (soulbound tokens)
        require(from == address(0) || to == address(0), "Membership NFTs are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _burn(uint256 tokenId) 
        internal 
        override(ERC721, ERC721URIStorage) 
    {
        super._burn(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
