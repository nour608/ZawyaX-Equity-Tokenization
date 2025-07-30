// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

interface DataTypes {
    /**
     *
     *        Enums           *
     *
     */
    enum OrderType {
        BUY,
        SELL
    }
    enum OrderStatus {
        ACTIVE,
        FILLED,
        CANCELLED,
        PARTIALLY_FILLED
    }

    /**
     *
     *     Market Orders      *
     *
     */
    struct Order {
        uint256 orderId; // Unique order identifier
        uint256 projectId; // Project this order belongs to
        address trader; // Who placed the order
        OrderType orderType; // BUY or SELL
        uint256 shares; // Total shares in order
        uint256 sharesRemaining; // Shares left to fill
        uint256 pricePerShare; // Price per share in purchase token
        uint256 totalValue; // Total order value
        uint256 timestamp; // When order was created
        uint256 expirationTime; // When order expires (0 = no expiration)
        OrderStatus status; // Current order status
        bool isMarketOrder; // True for market orders, false for limit orders
    }

    struct Trade {
        uint256 tradeId; // Unique trade identifier
        uint256 buyOrderId; // Buy order ID
        uint256 sellOrderId; // Sell order ID
        address buyer; // Buyer address
        address seller; // Seller address
        uint256 shares; // Shares traded
        uint256 pricePerShare; // Execution price
        uint256 totalValue; // Total trade value
        uint256 timestamp; // Trade execution time
    }

    struct MarketStats {
        uint256 lastPrice; // Last traded price
        uint256 highPrice24h; // 24h high
        uint256 lowPrice24h; // 24h low
        uint256 volume24h; // 24h trading volume
        uint256 totalTrades; // Total number of trades
        uint256 bestBidPrice; // Highest buy order price
        uint256 bestAskPrice; // Lowest sell order price
        uint256 spread; // Bid-ask spread
        uint256 lastUpdateTime; // Last price update
    }

    /**
     *
     *        Profiles         *
     *
     */
    struct Profile {
        string name;
        address walletAddress;
        bool isFounder;
        bool isInvestor;
        bytes32 ipfsCID; // for storing user's profile picture, skills, description, etc.
    }

    /**
     *
     *        Projects         *
     *
     */
    struct Project {
        string name;
        address equityToken; // Deployed ERC20 token, this is the token that represents the project's equity
        address purchaseToken; // this is the token that will be used to purchase the project's equity
        uint256 valuationUSD; // Project valuation in USD (no decimals)
        uint256 totalShares; // Total share supply (whole units)
        uint256 availableSharesToSell; // Shares to sell
        uint256 sharesSold; // Shares already sold
        uint256 pricePerShare; // Stablecoin units per 1 share
        uint256 availableFunds; // Available funds to withdraw
        bytes32 ipfsCID; // IPFS hash / URI
        address founder; // Project founder
        bool exists; // Flag to check if project exists
        bool verified; // Flag to check if project is verified by the platform
        // Secondary market fields
        bool secondaryMarketEnabled; // Whether secondary trading is enabled
    }
}
