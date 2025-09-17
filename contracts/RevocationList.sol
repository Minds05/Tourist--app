// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RevocationList
 * @dev Bitmap-based credential status list for efficient revocation management
 * @notice This contract implements a status list mechanism for verifiable credentials
 */
contract RevocationList is AccessControl, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Status list metadata
    struct StatusList {
        uint256 listId;
        string purpose; // "revocation" or "suspension"
        uint256 length; // Number of credentials in this list
        mapping(uint256 => uint256) statusBits; // Packed bits for status
        uint256 created;
        uint256 updated;
        bool isActive;
    }

    // Credential status information
    struct CredentialStatus {
        uint256 listId;
        uint256 statusListIndex;
        bool isRevoked;
        bool isSuspended;
        uint256 revokedAt;
        uint256 suspendedAt;
        string reason;
    }

    // Mappings
    mapping(uint256 => StatusList) public statusLists;
    mapping(string => CredentialStatus) public credentialStatuses;
    mapping(string => bool) public credentialExists;
    
    // Counters
    uint256 public nextListId;
    uint256 public totalCredentials;
    
    // Constants
    uint256 private constant BITS_PER_WORD = 256;

    // Events
    event StatusListCreated(
        uint256 indexed listId,
        string purpose,
        uint256 timestamp
    );
    
    event CredentialRevoked(
        string indexed credentialId,
        uint256 indexed listId,
        uint256 statusListIndex,
        string reason,
        uint256 timestamp
    );
    
    event CredentialSuspended(
        string indexed credentialId,
        uint256 indexed listId,
        uint256 statusListIndex,
        string reason,
        uint256 timestamp
    );
    
    event CredentialReinstated(
        string indexed credentialId,
        uint256 indexed listId,
        uint256 statusListIndex,
        uint256 timestamp
    );
    
    event IssuerAdded(address indexed issuer, uint256 timestamp);
    event IssuerRemoved(address indexed issuer, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        
        nextListId = 1;
    }

    /**
     * @dev Create a new status list
     * @param _purpose Purpose of the status list ("revocation" or "suspension")
     * @return listId The ID of the created status list
     */
    function createStatusList(string memory _purpose) 
        external 
        onlyRole(ADMIN_ROLE) 
        returns (uint256 listId) 
    {
        require(
            keccak256(bytes(_purpose)) == keccak256(bytes("revocation")) ||
            keccak256(bytes(_purpose)) == keccak256(bytes("suspension")),
            "Invalid purpose"
        );

        listId = nextListId++;
        StatusList storage newList = statusLists[listId];
        newList.listId = listId;
        newList.purpose = _purpose;
        newList.length = 0;
        newList.created = block.timestamp;
        newList.updated = block.timestamp;
        newList.isActive = true;

        emit StatusListCreated(listId, _purpose, block.timestamp);
    }

    /**
     * @dev Register a new credential in the status list
     * @param _credentialId Unique identifier for the credential
     * @param _listId Status list ID
     * @return statusListIndex The index assigned to this credential
     */
    function registerCredential(
        string memory _credentialId,
        uint256 _listId
    ) external onlyRole(ISSUER_ROLE) returns (uint256 statusListIndex) {
        require(bytes(_credentialId).length > 0, "Credential ID cannot be empty");
        require(statusLists[_listId].isActive, "Status list not active");
        require(!credentialExists[_credentialId], "Credential already registered");

        statusListIndex = statusLists[_listId].length;
        statusLists[_listId].length++;
        statusLists[_listId].updated = block.timestamp;

        credentialStatuses[_credentialId] = CredentialStatus({
            listId: _listId,
            statusListIndex: statusListIndex,
            isRevoked: false,
            isSuspended: false,
            revokedAt: 0,
            suspendedAt: 0,
            reason: ""
        });

        credentialExists[_credentialId] = true;
        totalCredentials++;
    }

    /**
     * @dev Revoke a credential
     * @param _credentialId Credential identifier
     * @param _reason Reason for revocation
     */
    function revokeCredential(
        string memory _credentialId,
        string memory _reason
    ) external onlyRole(ISSUER_ROLE) nonReentrant {
        require(credentialExists[_credentialId], "Credential not found");
        
        CredentialStatus storage status = credentialStatuses[_credentialId];
        require(!status.isRevoked, "Credential already revoked");

        uint256 listId = status.listId;
        uint256 index = status.statusListIndex;

        // Set the bit in the status list
        _setBit(listId, index, true);

        // Update credential status
        status.isRevoked = true;
        status.revokedAt = block.timestamp;
        status.reason = _reason;

        // Update status list timestamp
        statusLists[listId].updated = block.timestamp;

        emit CredentialRevoked(_credentialId, listId, index, _reason, block.timestamp);
    }

    /**
     * @dev Suspend a credential (temporary revocation)
     * @param _credentialId Credential identifier
     * @param _reason Reason for suspension
     */
    function suspendCredential(
        string memory _credentialId,
        string memory _reason
    ) external onlyRole(ISSUER_ROLE) nonReentrant {
        require(credentialExists[_credentialId], "Credential not found");
        
        CredentialStatus storage status = credentialStatuses[_credentialId];
        require(!status.isRevoked, "Cannot suspend revoked credential");
        require(!status.isSuspended, "Credential already suspended");

        uint256 listId = status.listId;
        uint256 index = status.statusListIndex;

        // Set the bit in the status list
        _setBit(listId, index, true);

        // Update credential status
        status.isSuspended = true;
        status.suspendedAt = block.timestamp;
        status.reason = _reason;

        // Update status list timestamp
        statusLists[listId].updated = block.timestamp;

        emit CredentialSuspended(_credentialId, listId, index, _reason, block.timestamp);
    }

    /**
     * @dev Reinstate a suspended credential
     * @param _credentialId Credential identifier
     */
    function reinstateCredential(
        string memory _credentialId
    ) external onlyRole(ISSUER_ROLE) nonReentrant {
        require(credentialExists[_credentialId], "Credential not found");
        
        CredentialStatus storage status = credentialStatuses[_credentialId];
        require(!status.isRevoked, "Cannot reinstate revoked credential");
        require(status.isSuspended, "Credential not suspended");

        uint256 listId = status.listId;
        uint256 index = status.statusListIndex;

        // Clear the bit in the status list
        _setBit(listId, index, false);

        // Update credential status
        status.isSuspended = false;
        status.suspendedAt = 0;
        status.reason = "";

        // Update status list timestamp
        statusLists[listId].updated = block.timestamp;

        emit CredentialReinstated(_credentialId, listId, index, block.timestamp);
    }

    /**
     * @dev Check if a credential is revoked
     * @param _credentialId Credential identifier
     * @return True if credential is revoked
     */
    function isRevoked(string memory _credentialId) external view returns (bool) {
        if (!credentialExists[_credentialId]) {
            return false;
        }
        return credentialStatuses[_credentialId].isRevoked;
    }

    /**
     * @dev Check if a credential is suspended
     * @param _credentialId Credential identifier
     * @return True if credential is suspended
     */
    function isSuspended(string memory _credentialId) external view returns (bool) {
        if (!credentialExists[_credentialId]) {
            return false;
        }
        return credentialStatuses[_credentialId].isSuspended;
    }

    /**
     * @dev Check credential status by list ID and index
     * @param _listId Status list ID
     * @param _index Status list index
     * @return True if credential is revoked/suspended
     */
    function getStatusByIndex(uint256 _listId, uint256 _index) 
        external 
        view 
        returns (bool) 
    {
        require(statusLists[_listId].isActive, "Status list not active");
        require(_index < statusLists[_listId].length, "Index out of bounds");
        
        return _getBit(_listId, _index);
    }

    /**
     * @dev Get credential status details
     * @param _credentialId Credential identifier
     * @return Credential status information
     */
    function getCredentialStatus(string memory _credentialId)
        external
        view
        returns (
            uint256 listId,
            uint256 statusListIndex,
            bool isRevoked,
            bool isSuspended,
            uint256 revokedAt,
            uint256 suspendedAt,
            string memory reason
        )
    {
        require(credentialExists[_credentialId], "Credential not found");
        
        CredentialStatus memory status = credentialStatuses[_credentialId];
        return (
            status.listId,
            status.statusListIndex,
            status.isRevoked,
            status.isSuspended,
            status.revokedAt,
            status.suspendedAt,
            status.reason
        );
    }

    /**
     * @dev Get status list information
     * @param _listId Status list ID
     * @return Status list details
     */
    function getStatusList(uint256 _listId)
        external
        view
        returns (
            uint256 listId,
            string memory purpose,
            uint256 length,
            uint256 created,
            uint256 updated,
            bool isActive
        )
    {
        StatusList storage list = statusLists[_listId];
        return (
            list.listId,
            list.purpose,
            list.length,
            list.created,
            list.updated,
            list.isActive
        );
    }

    /**
     * @dev Add issuer role to an address
     * @param _issuer Address to grant issuer role
     */
    function addIssuer(address _issuer) external onlyRole(ADMIN_ROLE) {
        require(_issuer != address(0), "Invalid issuer address");
        _grantRole(ISSUER_ROLE, _issuer);
        emit IssuerAdded(_issuer, block.timestamp);
    }

    /**
     * @dev Remove issuer role from an address
     * @param _issuer Address to revoke issuer role
     */
    function removeIssuer(address _issuer) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, _issuer);
        emit IssuerRemoved(_issuer, block.timestamp);
    }

    /**
     * @dev Internal function to set a bit in the status list
     * @param _listId Status list ID
     * @param _index Bit index
     * @param _value Bit value (true/false)
     */
    function _setBit(uint256 _listId, uint256 _index, bool _value) internal {
        uint256 wordIndex = _index / BITS_PER_WORD;
        uint256 bitIndex = _index % BITS_PER_WORD;
        uint256 mask = 1 << bitIndex;

        if (_value) {
            statusLists[_listId].statusBits[wordIndex] |= mask;
        } else {
            statusLists[_listId].statusBits[wordIndex] &= ~mask;
        }
    }

    /**
     * @dev Internal function to get a bit from the status list
     * @param _listId Status list ID
     * @param _index Bit index
     * @return Bit value (true/false)
     */
    function _getBit(uint256 _listId, uint256 _index) internal view returns (bool) {
        uint256 wordIndex = _index / BITS_PER_WORD;
        uint256 bitIndex = _index % BITS_PER_WORD;
        uint256 mask = 1 << bitIndex;

        return (statusLists[_listId].statusBits[wordIndex] & mask) != 0;
    }
}
