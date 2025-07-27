// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import {DataTypes} from "./utils/DataTypes.sol";

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract UserRegistry is DataTypes, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(address => Profile) public profiles;
    mapping(string => bool) private usedNames;


    event ProfileCreated(string name, address walletAddress, bool isFounder, bool isInvestor, bytes32 ipfsCID);
    event ProfileUpdated(address walletAddress, bytes32 newIpfsCID, uint256 timestamp);


    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createProfile(
        string calldata _name,
        bool _isFounder,
        bool _isInvestor,
        bytes32 _ipfsCID
    ) external {
        require(!usedNames[_name], "Name already taken");
        require(profiles[msg.sender].walletAddress == address(0), "Profile already exists");

        profiles[msg.sender] = Profile({
            name: _name,
            walletAddress: msg.sender,
            isFounder: _isFounder,
            isInvestor: _isInvestor,
            ipfsCID: _ipfsCID
        });

        // Mark the name as used
        usedNames[_name] = true;

        emit ProfileCreated(_name, msg.sender, _isFounder, _isInvestor, _ipfsCID);
    }

    // Function to update a profile
    function updateProfile(bytes32 _newIpfsCID) external {
        require(profiles[msg.sender].walletAddress != address(0), "Profile does not exist");

        // Update the IPFS CID
        profiles[msg.sender].ipfsCID = _newIpfsCID;

        emit ProfileUpdated(msg.sender, _newIpfsCID, block.timestamp);
    }

    function getProfile(address _walletAddress) external view returns (Profile memory) {
        return profiles[_walletAddress];
    }



    //////////////////////
    /// Admin functions///
    //////////////////////

}