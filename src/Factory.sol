// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "./utils/DataTypes.sol";
import {UserRegistry} from "./UserRegistry.sol";
import {ICurrencyManager} from "./interfaces/ICurrencyManager.sol";

import "./EquityToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Factory is AccessControl, DataTypes {
    using SafeERC20 for IERC20;

    UserRegistry public userRegistry;
    ICurrencyManager public currencyManager;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Counter for project IDs
    uint256 public projectCounter;

    uint256 public BASIS_POINTS = 10000; // 10_000 is 100%
    uint256 public PLATFORM_FEE; // 500 is 5% , Percentage of the budget to be paid as platform fee

    // Mapping from project ID to Project struct
    mapping(uint256 => Project) public projects;

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed founder,
        address equityToken,
        address purchaseToken,
        uint256 valuationUSD,
        uint256 totalShares,
        bytes32 ipfsCID
    );
    event SharesPurchased(uint256 indexed projectId, address indexed buyer, uint256 shares, uint256 amountPaid);
    event FundsWithdrawn(uint256 indexed projectId, uint256 amount);
    event ProjectVerified(uint256 indexed projectId, bool verified);
    event ProjectExists(uint256 indexed projectId, bool exists);

    constructor(address _userRegistry, address _currencyManager, uint256 _platformFee) {
        currencyManager = ICurrencyManager(_currencyManager);
        userRegistry = UserRegistry(_userRegistry);
        PLATFORM_FEE = _platformFee;
        projectCounter = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /// @notice Create a new tokenized project
    /// @param ipfsCID IPFS hash / URI for project metadata
    /// @param valuationUSD Total valuation in USD (no decimals)
    /// @param totalShares Number of shares to issue (whole units)
    /// @param _purchaseToken Address of ERC20 stablecoin (e.g. USDC)
    function createProject(bytes32 ipfsCID, uint256 valuationUSD, uint256 totalShares, address _purchaseToken, string memory _name, string memory _symbol)
        external
        returns (uint256 projectId)
    {
        require(valuationUSD > 0, "Valuation > 0");
        require(totalShares > 0, "Shares > 0");
        require(currencyManager.isCurrencyWhitelisted(_purchaseToken), "Purchase token not whitelisted");

        // project name + " Equity Token", e.g. "ZawyaX Equity Token"
        string memory name = _name + " Equity Token";
        // Deploy new ERC20 token for this project
        EquityToken token = new EquityToken(msg.sender, address(this), totalShares, name, _symbol);

        // Calculate price: (valuationUSD * 10^stableDecimals) / totalShares
        uint8 decimals = IERC20Metadata(_purchaseToken).decimals();
        uint256 stableUnit = 10 ** decimals;
        uint256 price = (valuationUSD * stableUnit) / totalShares;

        // Get next project ID
        projectId = projectCounter;
        projectCounter++;

        // Initialize project struct
        projects[projectId] = Project({
            equityToken: address(token),
            purchaseToken: _purchaseToken,
            valuationUSD: valuationUSD,
            totalShares: totalShares,
            sharesSold: 0,
            pricePerShare: price,
            ipfsCID: ipfsCID,
            founder: msg.sender,
            exists: true,
            verified: false
        });

        emit ProjectCreated(projectId, msg.sender, address(token), _purchaseToken, valuationUSD, totalShares, ipfsCID);
    }

    /// @notice Buy shares in a given project
    /// @param projectId ID of the project
    /// @param shares Number of shares to buy
    function buyShares(uint256 projectId, uint256 shares) external {
        Project storage p = projects[projectId];
        require(p.exists, "Project does not exist");
        require(shares > 0, "Must buy ≥1 share");
        require(p.sharesSold + shares <= p.totalShares, "Not enough shares");

        uint256 cost = shares * p.pricePerShare;
        uint256 tokensToTransfer = shares * (10 ** IERC20Metadata(p.equityToken).decimals());

        // Pull stablecoins from buyer
        IERC20(p.purchaseToken).safeTransferFrom(msg.sender, address(this), cost);
        // Send equity tokens to buyer
        IERC20(p.equityToken).safeTransfer(msg.sender, tokensToTransfer);

        p.sharesSold += shares;
        emit SharesPurchased(projectId, msg.sender, shares, cost);
    }

    /// @notice Developer withdraws all raised funds for their project
    /// @param projectId ID of the project
    function withdrawFunds(uint256 projectId) external {
        Project storage p = projects[projectId];
        require(p.exists, "Project does not exist");
        require(msg.sender == p.founder, "Not project owner");
        uint256 balance = IERC20(p.purchaseToken).balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");

        IERC20(p.purchaseToken).safeTransfer(p.founder, balance);
        emit FundsWithdrawn(projectId, balance);
    }

    // TODO: dividend distribution logic (e.g., snapshot + pro-rata payouts)
    // TODO: governance/voting integration (e.g., ERC20Votes)

    /// @notice Get number of projects created
    function projectCount() external view returns (uint256) {
        return projectCounter;
    }

    /// @notice Check if a project exists
    /// @param projectId ID of the project
    function projectExists(uint256 projectId) external view returns (bool) {
        return projects[projectId].exists;
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        return projects[projectId];
    }

    /**************************
     *     Admin functions    *
     **************************/

    function setPlatformFee(uint256 _platformFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        PLATFORM_FEE = _platformFee;
    }

    function setProjectVerified(uint256 projectId, bool _verified) external onlyRole(DEFAULT_ADMIN_ROLE) {
        projects[projectId].verified = _verified;
        emit ProjectVerified(projectId, _verified);
    }

    function setProjectExists(uint256 projectId, bool _exists) external onlyRole(DEFAULT_ADMIN_ROLE) {
        projects[projectId].exists = _exists;
        emit ProjectExists(projectId, _exists);
    }
}

