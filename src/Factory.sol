// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "./utils/DataTypes.sol";
import {UserRegistry} from "./UserRegistry.sol";
import {ICurrencyManager} from "./interfaces/ICurrencyManager.sol";
import {OrderBookLib} from "./libraries/OrderBookLib.sol";
import {EquityToken} from "./EquityToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract Factory is AccessControl, ReentrancyGuard, Pausable, DataTypes {
    using SafeERC20 for IERC20;
    using OrderBookLib for mapping(uint256 => Project);

    UserRegistry public userRegistry;
    ICurrencyManager public currencyManager;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Counter for project IDs
    uint256 public projectCounter;

    uint256 public constant TOTAL_SHARES = 1_000_000 * 1e18; // 100% of the total shares
    uint256 public constant BASIS_POINTS = 10_000; // 10_000 is 100%
    uint256 public PLATFORM_FEE; // (e.g., 500 = 5%) 
    uint256 public TRADING_FEE_RATE; // Global trading fee rate in basis points (e.g., 25 = 0.25%)

    uint256 public TradeFeeAmount;

    // Mapping from project ID to Project struct
    mapping(uint256 => Project) public projects;
    

    // @todo : make the oderId and tradeId unique for each project
    // Trading storage (centralized for all projects)
    uint256 public orderCounter;
    uint256 public tradeCounter;
    
    // Order storage: orderId => Order
    mapping(uint256 => Order) public orders;
    
    // User orders: user => orderIds[]
    mapping(address => uint256[]) public userOrders;
    
    // Project-specific order books: projectId => buyOrderIds[]
    mapping(uint256 => uint256[]) public projectBuyOrders;
    mapping(uint256 => uint256[]) public projectSellOrders;
    
    // Trading history: projectId => trades[]
    mapping(uint256 => Trade[]) public projectTrades;
    
    // Market statistics: projectId => MarketStats
    mapping(uint256 => MarketStats) public projectMarketStats;

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
    event FundsWithdrawn(uint256 indexed projectId, uint256 amount, address to, address from);
    event ProjectVerified(uint256 indexed projectId, bool verified);
    event ProjectExists(uint256 indexed projectId, bool exists);
    event SecondaryMarketEnabled(uint256 indexed projectId, address indexed orderBook, uint256 tradingFeeRate);
    event SecondaryMarketDisabled(uint256 indexed projectId);

    modifier onlyFactoryAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only factory admin can call this function");
        _;
    }

    modifier onlyProjectFounder(uint256 projectId) {
        require(projects[projectId].founder == msg.sender, "Only project founder can call this function");
        _;
    }

    constructor(address _userRegistry, address _currencyManager, uint256 _platformFee, uint256 _tradingFeeRate) {
        currencyManager = ICurrencyManager(_currencyManager);
        userRegistry = UserRegistry(_userRegistry);
        PLATFORM_FEE = _platformFee;
        TRADING_FEE_RATE = _tradingFeeRate;
        projectCounter = 1;
        orderCounter = 1;
        tradeCounter = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /// @notice Create a new tokenized project
    /// @param ipfsCID IPFS hash / URI for project metadata
    /// @param valuationUSD Total valuation in USD (no decimals)
    /// @param sharesToSell Number of shares to issue (whole units)
    /// @param _purchaseToken Address of ERC20 stablecoin (e.g. USDC)
    function createProject(bytes32 ipfsCID, uint256 valuationUSD, uint256 sharesToSell, address _purchaseToken, string memory _name, string memory _symbol)
        external
        returns (uint256 projectId)
    {
        require(valuationUSD > 0, "Valuation must be greater than 0");
        require(sharesToSell > 0, "Shares must be greater than 0");
        require(sharesToSell <= TOTAL_SHARES, "Shares must be less than or equal to total shares");
        require(currencyManager.isCurrencyWhitelisted(_purchaseToken), "Purchase token not whitelisted");

        // @audit : sharesToSell instead of TOTAL_SHARES
        uint256 platformFee = (TOTAL_SHARES * PLATFORM_FEE) / BASIS_POINTS;
    
        // project name + " Equity Token", e.g. "ZawyaX Equity Token"
        string memory name = string(abi.encodePacked(_name, " Equity Token"));
        // Deploy new ERC20 token for this project
        EquityToken token = new EquityToken(name, _symbol, msg.sender, address(this), sharesToSell, platformFee);

        // Calculate price: (valuationUSD * 10^stableDecimals) / totalShares
        uint8 decimals = IERC20Metadata(_purchaseToken).decimals();
        uint256 stableUnit = 10 ** decimals;
        uint256 price = (valuationUSD * stableUnit * 1e18) / TOTAL_SHARES;

        // Get next project ID
        projectId = projectCounter;
        projectCounter++;

        // Initialize project struct
        projects[projectId] = Project({
            equityToken: address(token),
            purchaseToken: _purchaseToken,
            valuationUSD: valuationUSD,
            totalShares: TOTAL_SHARES,
            availableSharesToSell: sharesToSell,
            sharesSold: 0,
            pricePerShare: price,
            availableFunds: 0,
            ipfsCID: ipfsCID,
            founder: msg.sender,
            exists: true,
            verified: false,
            secondaryMarketEnabled: false
        });

        emit ProjectCreated(projectId, msg.sender, address(token), _purchaseToken, valuationUSD, TOTAL_SHARES, ipfsCID);
    }

    /// @notice Buy shares in a given project
    /// @param projectId ID of the project
    /// @param sharesAmount Number of shares to buy
    function buyShares(uint256 projectId, uint256 sharesAmount) external {
        Project storage p = projects[projectId];
        require(p.exists, "Project does not exist");
        require(sharesAmount > 0, "Must buy at least 1 share");
        require(sharesAmount <= p.availableSharesToSell, "Not enough shares to sell");  // check if the project has enough shares to sell

        uint256 cost = (sharesAmount * p.pricePerShare) / 1e18; 
        uint256 tokensToMint = sharesAmount; // Equity tokens have 18 decimals

        p.availableSharesToSell -= sharesAmount;
        p.sharesSold += sharesAmount;
        p.availableFunds += cost;

        // Pull stablecoins from buyer
        IERC20(p.purchaseToken).safeTransferFrom(msg.sender, address(this), cost);
        // Mint equity tokens to buyer
        EquityToken(p.equityToken).mint(msg.sender, tokensToMint);

        emit SharesPurchased(projectId, msg.sender, tokensToMint, cost);
    }

    /// @notice Developer withdraws all raised funds for their project
    /// @param projectId ID of the project
    function withdrawFunds(uint256 projectId, uint256 amount, address to) external {
        Project storage p = projects[projectId];
        require(p.exists, "Project does not exist");

        if (!p.verified) {
            require(msg.sender == p.founder, "Not project founder");
            require(amount > 0, "Amount must be greater than 0");
            require(amount <= p.availableFunds, "Not enough funds to withdraw");
            p.availableFunds -= amount;
            if (to == address(0)) {
                to = p.founder;
            }
            IERC20(p.purchaseToken).safeTransfer(to, amount);
            emit FundsWithdrawn(projectId, amount, to, msg.sender);
        } else if (p.verified) {
            require(hasRole(ADMIN_ROLE, msg.sender), "Not factory admin");  
            require(amount > 0, "Amount must be greater than 0");
            require(amount <= p.availableFunds, "Not enough funds to withdraw");
            p.availableFunds -= amount;
            if (to == address(0)) {
                revert("Invalid to address");
            }
            IERC20(p.purchaseToken).safeTransfer(to, amount);
            emit FundsWithdrawn(projectId, amount, to, msg.sender);
        }

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

    /************************************************
     *            Secondary Market Functions         *
     *************************************************/

    /// @notice Enable secondary market trading for a project
    /// @param projectId Project to enable trading for
    function enableSecondaryMarket(uint256 projectId) external {
        Project storage project = projects[projectId];
        require(project.exists, "Project does not exist");
        require(project.founder == msg.sender, "Only founder can enable market");
        require(!project.secondaryMarketEnabled, "Market already enabled");
        
        //@todo : add a check if the Project Equity Token is not paused on transfer
        
        // Update project to enable secondary market
        project.secondaryMarketEnabled = true;
        
        // Initialize market stats
        projectMarketStats[projectId].lastUpdateTime = block.timestamp;
        
        emit SecondaryMarketEnabled(projectId, address(this), TRADING_FEE_RATE);
    }

    /// @notice Disable secondary market trading for a project
    /// @param projectId Project to disable trading for
    function disableSecondaryMarket(uint256 projectId) external {
        Project storage project = projects[projectId];
        require(project.exists, "Project does not exist");
        require(project.founder == msg.sender, "Only founder can disable market");
        require(project.secondaryMarketEnabled, "Market not enabled");
        
        project.secondaryMarketEnabled = false;
        // Note: OrderBook contract remains deployed but trading is logically disabled
        
        emit SecondaryMarketDisabled(projectId);
    }

    /// @notice Get market price for a project
    /// @param projectId Project ID
    /// @return Current market price (returns initial price if no trades yet)
    function getMarketPrice(uint256 projectId) external view returns (uint256) {
        Project storage project = projects[projectId];
        if (!project.secondaryMarketEnabled) {
            return project.pricePerShare; // Return initial price if no secondary market
        }
        
        uint256 marketPrice = OrderBookLib.getMarketPrice(projectMarketStats, projectId);
        return marketPrice > 0 ? marketPrice : project.pricePerShare;
    }

    /// @notice Check if secondary market is enabled for a project
    /// @param projectId Project ID
    /// @return True if secondary market is enabled
    function isSecondaryMarketEnabled(uint256 projectId) external view returns (bool) {
        return projects[projectId].secondaryMarketEnabled;
    }

    /// @notice Place a limit order on the secondary market
    /// @param projectId Project to trade
    /// @param orderType BUY or SELL
    /// @param shares Number of shares
    /// @param pricePerShare Price per share
    /// @param expirationTime Order expiration timestamp (0 = no expiration)
    /// @return orderId Unique order identifier
    function placeLimitOrder(
        uint256 projectId,
        OrderType orderType,
        uint256 shares,
        uint256 pricePerShare,
        uint256 expirationTime
    ) external nonReentrant returns (uint256 orderId) {

        orderId = OrderBookLib.placeLimitOrder(
            projects,
            orders,
            userOrders,
            projectBuyOrders,
            projectSellOrders,
            projectId,
            orderType,
            shares,
            pricePerShare,
            expirationTime,
            orderCounter
        );

        orderCounter++;
        
        matchOrders(projectId);

        return orderId;
    }

    /// @notice Cancel an active order
    /// @param orderId Order to cancel
    function cancelOrder(uint256 orderId) external nonReentrant {
        OrderBookLib.cancelOrder(
            projects,
            orders,
            projectBuyOrders,
            projectSellOrders,
            orderId
        );
    }

    /// @notice Get order book depth for a project
    /// @param projectId Project ID
    /// @param depth Number of orders per side to return
    /// @return buyPrices Array of buy prices
    /// @return sharesToBuy Array of buy shares
    /// @return sellPrices Array of sell prices
    /// @return sharesToSell Array of sell shares
    function getOrderBookDepth(uint256 projectId, uint256 depth) external view returns (
        uint256[] memory buyPrices,
        uint256[] memory sharesToBuy,
        uint256[] memory sellPrices,
        uint256[] memory sharesToSell
    ) {
        return OrderBookLib.getOrderBookDepth(
            orders,
            projectBuyOrders,
            projectSellOrders,
            projectId,
            depth
        );
    }

    /// @notice Get user's active orders for a project
    /// @param user User address
    /// @param projectId Project ID
    /// @return userOrders Array of user's orders
    function getUserOrders(address user, uint256 projectId) external view returns (Order[] memory) {
        return OrderBookLib.getUserOrders(
            orders,
            userOrders,
            user,
            projectId
        );
    }

    /// @notice Get trading history for a project
    /// @param projectId Project ID
    /// @param limit Number of recent trades to return
    /// @return Recent trades array
    function getTradingHistory(uint256 projectId, uint256 limit) external view returns (Trade[] memory) {
        Trade[] storage allTrades = projectTrades[projectId];
        
        if (allTrades.length == 0) {
            return new Trade[](0);
        }
        
        uint256 returnLength = allTrades.length > limit ? limit : allTrades.length;
        Trade[] memory recentTrades = new Trade[](returnLength);
        
        // Return most recent trades
        for (uint256 i = 0; i < returnLength; i++) {
            recentTrades[i] = allTrades[allTrades.length - 1 - i];
        }
        
        return recentTrades;
    }

    /// @notice Get market statistics for a project
    /// @param projectId Project ID
    /// @return Market statistics
    function getMarketStats(uint256 projectId) external view returns (MarketStats memory) {
        return projectMarketStats[projectId];
    }

    /// @notice Manual order matching (can be called by anyone)
    /// @param projectId Project to match orders for
    /// @return tradesExecuted Number of trades executed
    /// @return feeAmount Total fee amount collected
    function matchOrders(uint256 projectId) public returns (uint256 tradesExecuted, uint256 feeAmount) {
        (tradesExecuted, feeAmount) = OrderBookLib.matchOrdersForProject(
            projects,
            orders,
            projectBuyOrders,
            projectSellOrders,
            projectTrades,
            projectMarketStats,
            projectId,
            TRADING_FEE_RATE,
            tradeCounter
        );
        tradeCounter++;
        TradeFeeAmount += feeAmount;
    }

    /************************************************
     *              Pause Management                *
     *************************************************/

    /// @notice Pause a project's equity token (admin only)
    /// @param projectId Project ID to pause
    function pauseProject(uint256 projectId) external onlyRole(ADMIN_ROLE) {
        Project storage project = projects[projectId];
        require(project.exists, "Project does not exist");
        
        EquityToken token = EquityToken(project.equityToken);
        token.pause();
    }

    /// @notice Unpause a project's equity token (admin only)  
    /// @param projectId Project ID to unpause
    function unpauseProject(uint256 projectId) external onlyRole(ADMIN_ROLE) {
        Project storage project = projects[projectId];
        require(project.exists, "Project does not exist");
        
        EquityToken token = EquityToken(project.equityToken);
        token.unpause();
    }

    /// @notice Check if a project is paused
    /// @param projectId Project ID to check
    /// @return True if paused
    function isProjectPaused(uint256 projectId) external view returns (bool) {
        Project storage project = projects[projectId];
        require(project.exists, "Project does not exist");
        
        EquityToken token = EquityToken(project.equityToken);
        return token.paused();
    }

    /// @notice Pause the factory
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause the factory
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    /************************************************
     *                 Admin functions               *
     *************************************************/

    function setPlatformFee(uint256 _platformFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        PLATFORM_FEE = _platformFee;
    }

    /// @notice Set global trading fee rate (admin only)
    /// @param _tradingFeeRate New trading fee rate in basis points
    function setTradingFeeRate(uint256 _tradingFeeRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_tradingFeeRate <= 1000, "Fee rate too high"); // Max 10%
        TRADING_FEE_RATE = _tradingFeeRate;
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

