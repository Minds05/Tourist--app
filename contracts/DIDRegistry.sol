// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DIDRegistry
 * @dev Registry for anchoring important DIDs on-chain for public resolution
 * @notice This contract allows registration and management of Decentralized Identifiers
 */
contract DIDRegistry is Ownable, ReentrancyGuard {
    struct DIDDocument {
        string did;
        string documentHash; // IPFS hash of the DID document
        address controller;
        uint256 created;
        uint256 updated;
        bool isActive;
    }

    // Mapping from DID to DID Document
    mapping(string => DIDDocument) public didDocuments;
    
    // Mapping from address to array of controlled DIDs
    mapping(address => string[]) public controllerToDIDs;
    
    // Array of all registered DIDs
    string[] public allDIDs;
    
    // Mapping to check if DID exists
    mapping(string => bool) public didExists;

    // Events
    event DIDRegistered(
        string indexed did,
        address indexed controller,
        string documentHash,
        uint256 timestamp
    );
    
    event DIDUpdated(
        string indexed did,
        address indexed controller,
        string newDocumentHash,
        uint256 timestamp
    );
    
    event DIDDeactivated(
        string indexed did,
        address indexed controller,
        uint256 timestamp
    );
    
    event DIDReactivated(
        string indexed did,
        address indexed controller,
        uint256 timestamp
    );
    
    event ControllerChanged(
        string indexed did,
        address indexed oldController,
        address indexed newController,
        uint256 timestamp
    );

    constructor() {}

    /**
     * @dev Register a new DID
     * @param _did The DID identifier
     * @param _documentHash IPFS hash of the DID document
     */
    function registerDID(
        string memory _did,
        string memory _documentHash
    ) external nonReentrant {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        require(!didExists[_did], "DID already exists");

        DIDDocument memory newDocument = DIDDocument({
            did: _did,
            documentHash: _documentHash,
            controller: msg.sender,
            created: block.timestamp,
            updated: block.timestamp,
            isActive: true
        });

        didDocuments[_did] = newDocument;
        controllerToDIDs[msg.sender].push(_did);
        allDIDs.push(_did);
        didExists[_did] = true;

        emit DIDRegistered(_did, msg.sender, _documentHash, block.timestamp);
    }

    /**
     * @dev Update DID document hash
     * @param _did The DID identifier
     * @param _newDocumentHash New IPFS hash of the DID document
     */
    function updateDIDDocument(
        string memory _did,
        string memory _newDocumentHash
    ) external nonReentrant {
        require(didExists[_did], "DID does not exist");
        require(bytes(_newDocumentHash).length > 0, "Document hash cannot be empty");
        
        DIDDocument storage document = didDocuments[_did];
        require(document.controller == msg.sender, "Only controller can update");
        require(document.isActive, "DID is deactivated");

        document.documentHash = _newDocumentHash;
        document.updated = block.timestamp;

        emit DIDUpdated(_did, msg.sender, _newDocumentHash, block.timestamp);
    }

    /**
     * @dev Deactivate a DID
     * @param _did The DID identifier
     */
    function deactivateDID(string memory _did) external nonReentrant {
        require(didExists[_did], "DID does not exist");
        
        DIDDocument storage document = didDocuments[_did];
        require(document.controller == msg.sender, "Only controller can deactivate");
        require(document.isActive, "DID already deactivated");

        document.isActive = false;
        document.updated = block.timestamp;

        emit DIDDeactivated(_did, msg.sender, block.timestamp);
    }

    /**
     * @dev Reactivate a DID
     * @param _did The DID identifier
     */
    function reactivateDID(string memory _did) external nonReentrant {
        require(didExists[_did], "DID does not exist");
        
        DIDDocument storage document = didDocuments[_did];
        require(document.controller == msg.sender, "Only controller can reactivate");
        require(!document.isActive, "DID already active");

        document.isActive = true;
        document.updated = block.timestamp;

        emit DIDReactivated(_did, msg.sender, block.timestamp);
    }

    /**
     * @dev Change controller of a DID
     * @param _did The DID identifier
     * @param _newController New controller address
     */
    function changeController(
        string memory _did,
        address _newController
    ) external nonReentrant {
        require(didExists[_did], "DID does not exist");
        require(_newController != address(0), "Invalid new controller");
        
        DIDDocument storage document = didDocuments[_did];
        require(document.controller == msg.sender, "Only controller can change controller");
        require(document.isActive, "DID is deactivated");

        address oldController = document.controller;
        document.controller = _newController;
        document.updated = block.timestamp;

        // Update controller mappings
        _removeDIDFromController(oldController, _did);
        controllerToDIDs[_newController].push(_did);

        emit ControllerChanged(_did, oldController, _newController, block.timestamp);
    }

    /**
     * @dev Get DID document
     * @param _did The DID identifier
     * @return DID document details
     */
    function getDIDDocument(string memory _did) 
        external 
        view 
        returns (
            string memory did,
            string memory documentHash,
            address controller,
            uint256 created,
            uint256 updated,
            bool isActive
        ) 
    {
        require(didExists[_did], "DID does not exist");
        
        DIDDocument memory document = didDocuments[_did];
        return (
            document.did,
            document.documentHash,
            document.controller,
            document.created,
            document.updated,
            document.isActive
        );
    }

    /**
     * @dev Get DIDs controlled by an address
     * @param _controller Controller address
     * @return Array of DIDs controlled by the address
     */
    function getDIDsByController(address _controller) 
        external 
        view 
        returns (string[] memory) 
    {
        return controllerToDIDs[_controller];
    }

    /**
     * @dev Get total number of registered DIDs
     * @return Total count of DIDs
     */
    function getTotalDIDs() external view returns (uint256) {
        return allDIDs.length;
    }

    /**
     * @dev Get DID by index
     * @param _index Index in the allDIDs array
     * @return DID identifier
     */
    function getDIDByIndex(uint256 _index) external view returns (string memory) {
        require(_index < allDIDs.length, "Index out of bounds");
        return allDIDs[_index];
    }

    /**
     * @dev Check if DID is active
     * @param _did The DID identifier
     * @return True if DID exists and is active
     */
    function isDIDActive(string memory _did) external view returns (bool) {
        if (!didExists[_did]) {
            return false;
        }
        return didDocuments[_did].isActive;
    }

    /**
     * @dev Internal function to remove DID from controller mapping
     * @param _controller Controller address
     * @param _did DID to remove
     */
    function _removeDIDFromController(address _controller, string memory _did) internal {
        string[] storage dids = controllerToDIDs[_controller];
        for (uint256 i = 0; i < dids.length; i++) {
            if (keccak256(bytes(dids[i])) == keccak256(bytes(_did))) {
                dids[i] = dids[dids.length - 1];
                dids.pop();
                break;
            }
        }
    }

    /**
     * @dev Emergency function to register issuer DID (only owner)
     * @param _issuerDID The issuer DID
     * @param _documentHash IPFS hash of the issuer DID document
     * @param _issuerAddress Address of the issuer
     */
    function registerIssuerDID(
        string memory _issuerDID,
        string memory _documentHash,
        address _issuerAddress
    ) external onlyOwner {
        require(bytes(_issuerDID).length > 0, "Issuer DID cannot be empty");
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        require(_issuerAddress != address(0), "Invalid issuer address");
        require(!didExists[_issuerDID], "Issuer DID already exists");

        DIDDocument memory issuerDocument = DIDDocument({
            did: _issuerDID,
            documentHash: _documentHash,
            controller: _issuerAddress,
            created: block.timestamp,
            updated: block.timestamp,
            isActive: true
        });

        didDocuments[_issuerDID] = issuerDocument;
        controllerToDIDs[_issuerAddress].push(_issuerDID);
        allDIDs.push(_issuerDID);
        didExists[_issuerDID] = true;

        emit DIDRegistered(_issuerDID, _issuerAddress, _documentHash, block.timestamp);
    }
}
