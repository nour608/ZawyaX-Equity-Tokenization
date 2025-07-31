// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "./utils/DataTypes.sol";
import {UserRegistry} from "./UserRegistry.sol";
import {ICurrencyManager} from "./interfaces/ICurrencyManager.sol";
import {OrderBook} from "./Implementations/OrderBookImp.sol";
import {EquityToken} from "./EquityToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract Factory is
    AccessControl,
    ReentrancyGuard,
    Pausable,
    DataTypes,
    OrderBook
{
    using SafeERC20 for IERC20;

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

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed founder,
        address equityToken,
        address purchaseToken,
        uint256 valuationUSD,
        uint256 totalShares,
        bytes32 ipfsCID
    );
    event SharesPurchased(
        uint256 indexed projectId,
        address indexed buyer,
        uint256 shares,
        uint256 amountPaid
    );
    event FundsWithdrawn(
        uint256 indexed projectId,
        uint256 amount,
        address to,
        address from
    );
    event ProjectVerified(uint256 indexed projectId, bool verified);
    event ProjectExists(uint256 indexed projectId, bool exists);
    event SecondaryMarketEnabled(
        uint256 indexed projectId,
        address indexed orderBook,
        uint256 tradingFeeRate
    );
    event FeesWithdrawn(
        address indexed to,
        address indexed token,
        uint256 amount
    );

    modifier onlyFactoryAdmin() {
        _onlyFactoryAdmin();
        _;
    }

    modifier onlyProjectFounder(uint256 projectId) {
        _onlyProjectFounder(projectId);
        _;
    }

    modifier onlyProjectFounderOrAdmin(uint256 projectId) {
        _onlyProjectFounderOrAdmin(projectId);
        _;
    }

    constructor(
        address _userRegistry,
        address _currencyManager,
        uint256 _platformFee,
        uint256 _tradingFeeRate
    ) {
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
    function createProject(
        bytes32 ipfsCID,
        uint256 valuationUSD,
        uint256 sharesToSell,
        address _purchaseToken,
        string memory _name,
        string memory _symbol
    ) external whenNotPaused returns (uint256 projectId) {
        require(valuationUSD > 0, "Valuation must be greater than 0");
        require(sharesToSell > 0, "Shares must be greater than 0");
        require(
            sharesToSell <= TOTAL_SHARES,
            "Shares must be less than or equal to total shares"
        );
        require(
            currencyManager.isCurrencyWhitelisted(_purchaseToken),
            "Purchase token not whitelisted"
        );

        // platform fee is a percentage of the shares to sell
        uint256 platformFee = (sharesToSell * PLATFORM_FEE) / BASIS_POINTS;

        // project name + " Equity Token", e.g. "ZawyaX Equity Token"
        string memory name = string(abi.encodePacked(_name, " Equity Token"));
        // Deploy new ERC20 token for this project
        EquityToken token = new EquityToken(
            name,
            _symbol,
            msg.sender,
            address(this),
            sharesToSell,
            platformFee
        );

        uint256 sharesToSellAfterPlatformFee = sharesToSell - platformFee;

        // Calculate price: (valuationUSD * 10^stableDecimals) / totalShares
        uint8 decimals = IERC20Metadata(_purchaseToken).decimals();
        uint256 stableUnit = 10 ** decimals;
        uint256 price = (valuationUSD * stableUnit) / TOTAL_SHARES;

        // Get next project ID
        projectId = projectCounter;
        projectCounter++;

        // Initialize project struct
        projects[projectId] = Project({
            name: _name,
            equityToken: address(token),
            purchaseToken: _purchaseToken,
            valuationUSD: valuationUSD,
            totalShares: TOTAL_SHARES,
            availableSharesToSell: sharesToSellAfterPlatformFee,
            sharesSold: 0,
            pricePerShare: price,
            availableFunds: 0,
            ipfsCID: ipfsCID,
            founder: msg.sender,
            exists: true,
            verified: false,
            secondaryMarketEnabled: false
        });

        emit ProjectCreated(
            projectId,
            msg.sender,
            address(token),
            _purchaseToken,
            valuationUSD,
            TOTAL_SHARES,
            ipfsCID
        );
    }

    /// @notice Buy shares in a given project
    /// @param projectId ID of the project
    /// @param sharesAmount Number of shares to buy
    function buyShares(
        uint256 projectId,
        uint256 sharesAmount
    ) external whenNotPaused {
        Project storage p = projects[projectId];
        require(p.exists, "Project does not exist");
        require(sharesAmount > 0, "Must buy at least 1 share");
        require(
            sharesAmount <= p.availableSharesToSell,
            "Not enough shares to sell"
        ); // check if the project has enough shares to sell

        uint256 cost = (sharesAmount * p.pricePerShare) / 1e18;
        uint256 tokensToMint = sharesAmount; // Equity tokens have 18 decimals

        p.availableSharesToSell -= sharesAmount;
        p.sharesSold += sharesAmount;
        p.availableFunds += cost;

        // Pull stablecoins from buyer
        IERC20(p.purchaseToken).safeTransferFrom(
            msg.sender,
            address(this),
            cost
        );
        // Mint equity tokens to buyer
        EquityToken(p.equityToken).mint(msg.sender, tokensToMint);

        emit SharesPurchased(projectId, msg.sender, tokensToMint, cost);
    }

    /// @notice Developer withdraws all raised funds for their project
    /// @param projectId ID of the project
    function withdrawFunds(
        uint256 projectId,
        uint256 amount,
        address to
    ) external nonReentrant {
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
            require(
                hasRole(ADMIN_ROLE, msg.sender) ||
                    hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "Not factory admin"
            );
            require(amount > 0, "Amount must be greater than 0");
            require(amount <= p.availableFunds, "Not enough funds to withdraw");
            p.availableFunds -= amount;
            if (to == address(0)) {
                to = msg.sender;
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

    function getProject(
        uint256 projectId
    ) external view returns (Project memory) {
        return projects[projectId];
    }

    /*///////////////////////////////////////////////
         Secondary Market Functions 
    ///////////////////////////////////////////////*/

    /// @notice Enable secondary market trading for a project
    /// @param projectId Project to enable trading for
    function enableSecondaryMarket(
        uint256 projectId
    ) external whenNotPaused onlyProjectFounderOrAdmin(projectId) {
        Project storage project = projects[projectId];
        require(project.exists, "Project does not exist");
        require(!project.secondaryMarketEnabled, "Market already enabled");
        require(
            !isProjectPaused(projectId),
            "Project Equity Token Transfers are paused"
        );

        // Update project to enable secondary market
        project.secondaryMarketEnabled = true;

        // Initialize market stats
        projectMarketStats[projectId].lastUpdateTime = block.timestamp;

        emit SecondaryMarketEnabled(projectId, address(this), TRADING_FEE_RATE);
    }

    /// @notice Get market price for a project
    /// @param projectId Project ID
    /// @return Current market price (returns initial price if no trades yet)
    function getMarketPrice(
        uint256 projectId
    ) external view override returns (uint256) {
        Project storage project = projects[projectId];
        if (!project.secondaryMarketEnabled) {
            return project.pricePerShare; // Return initial price if no secondary market
        }

        uint256 marketPrice = projectMarketStats[projectId].lastPrice;
        return marketPrice > 0 ? marketPrice : project.pricePerShare;
    }

    /// @notice Check if secondary market is enabled for a project
    /// @param projectId Project ID
    /// @return True if secondary market is enabled
    function isSecondaryMarketEnabled(
        uint256 projectId
    ) external view returns (bool) {
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
    ) public override whenNotPaused returns (uint256 orderId) {
        orderId = super.placeLimitOrder(
            projectId,
            orderType,
            shares,
            pricePerShare,
            expirationTime
        );

        orderCounter++;

        matchOrders(projectId);

        return orderId;
    }

    /// @notice Cancel an active order
    /// @param orderId Order to cancel
    function cancelOrder(uint256 orderId) public override whenNotPaused {
        super.cancelOrder(orderId);
    }

    /// @notice Get order book depth for a project
    /// @param projectId Project ID
    /// @param depth Number of orders per side to return
    /// @return buyPrices Array of buy prices
    /// @return sharesToBuy Array of buy shares
    /// @return sellPrices Array of sell prices
    /// @return sharesToSell Array of sell shares
    function getOrderBookDepth(
        uint256 projectId,
        uint256 depth
    )
        public
        view
        override
        returns (
            uint256[] memory buyPrices,
            uint256[] memory sharesToBuy,
            uint256[] memory sellPrices,
            uint256[] memory sharesToSell
        )
    {
        return super.getOrderBookDepth(projectId, depth);
    }

    /// @notice Get user's active orders for a project
    /// @param user User address
    /// @param projectId Project ID
    /// @return userOrders Array of user's orders
    function getUserOrders(
        address user,
        uint256 projectId
    ) public view override returns (Order[] memory) {
        return super.getUserOrders(user, projectId);
    }

    /// @notice Get trading history for a project
    /// @param projectId Project ID
    /// @param limit Number of recent trades to return
    /// @return Recent trades array
    function getTradingHistory(
        uint256 projectId,
        uint256 limit
    ) external view returns (Trade[] memory) {
        Trade[] storage allTrades = projectTrades[projectId];

        if (allTrades.length == 0) {
            return new Trade[](0);
        }

        uint256 returnLength = allTrades.length > limit
            ? limit
            : allTrades.length;
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
    function getMarketStats(
        uint256 projectId
    ) external view returns (MarketStats memory) {
        return projectMarketStats[projectId];
    }

    /// @notice Manual order matching (can be called by anyone)
    /// @param projectId Project to match orders for
    /// @return tradesExecuted Number of trades executed
    /// @return feeAmount Total fee amount collected
    function matchOrders(
        uint256 projectId
    ) public whenNotPaused returns (uint256 tradesExecuted, uint256 feeAmount) {
        (tradesExecuted, feeAmount) = super.matchOrdersForProject(
            projectId,
            TRADING_FEE_RATE
        );
        tradeCounter++;
        TradeFeeAmount += feeAmount;
    }

    /*///////////////////////////////////////////////
                  Pause functions 
    ///////////////////////////////////////////////*/

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
    function isProjectPaused(uint256 projectId) public view returns (bool) {
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

    /*///////////////////////////////////////////////
                  Admin functions 
    ///////////////////////////////////////////////*/

    function withdrawFees(
        address to,
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        if (to == address(0)) {
            to = msg.sender;
            IERC20(token).safeTransfer(to, amount);
            emit FeesWithdrawn(to, token, amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
            emit FeesWithdrawn(to, token, amount);
        }
    }

    function setPlatformFee(
        uint256 _platformFee
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        PLATFORM_FEE = _platformFee;
    }

    /// @notice Set global trading fee rate (admin only)
    /// @param _tradingFeeRate New trading fee rate in basis points
    function setTradingFeeRate(
        uint256 _tradingFeeRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_tradingFeeRate <= 1000, "Fee rate too high"); // Max 10%
        TRADING_FEE_RATE = _tradingFeeRate;
    }

    function setProjectVerified(
        uint256 projectId,
        bool _verified
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        projects[projectId].verified = _verified;
        emit ProjectVerified(projectId, _verified);
    }

    function setProjectExists(
        uint256 projectId,
        bool _exists
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        projects[projectId].exists = _exists;
        emit ProjectExists(projectId, _exists);
    }

    /*///////////////////////////////////////////////
                  Internal functions 
    ///////////////////////////////////////////////*/

    function _onlyFactoryAdmin() internal view {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only factory admin can call this function"
        );
    }

    function _onlyProjectFounder(uint256 projectId) internal view {
        require(
            projects[projectId].founder == msg.sender,
            "Only project founder can call this function"
        );
    }

    function _onlyProjectFounderOrAdmin(uint256 projectId) internal view {
        require(
            projects[projectId].founder == msg.sender ||
                hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only project founder or admin can call this function"
        );
    }
}
