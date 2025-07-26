// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

interface DataTypes {

    /**************************
     *        Enums           *
     **************************/

    /**************************
     *        Profiles         *
     **************************/
    struct Profile {
        string name;
        address walletAddress;
        bool isFounder;
        bool isInvestor;
        bytes32 ipfsCID; // for storing user's profile picture, skills, description, etc.
    }

    /**************************
     *        Projects         *
     **************************/

     struct Project {
        address equityToken;      // Deployed ERC20 token, this is the token that represents the project's equity
        address purchaseToken;    // this is the token that will be used to purchase the project's equity
        uint256 valuationUSD;     // Project valuation in USD (no decimals)
        uint256 totalShares;      // Total share supply (whole units)
        uint256 sharesSold;       // Shares already sold
        uint256 pricePerShare;    // Stablecoin units per 1 share
        bytes32 ipfsCID;          // IPFS hash / URI
        address founder;          // Project founder
        bool exists;              // Flag to check if project exists
        bool verified;            // Flag to check if project is verified by the platform
    }
}