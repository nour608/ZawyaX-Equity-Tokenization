// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "../utils/DataTypes.sol";

interface IFactory {
    // Project Management
    function createProject(
        bytes32 ipfsCID,
        uint256 valuationUSD,
        uint256 sharesToSell,
        address _purchaseToken,
        string memory _name,
        string memory _symbol
    ) external returns (uint256 projectId);

    function buyShares(uint256 projectId, uint256 sharesAmount) external;
    function withdrawFunds(uint256 projectId, uint256 amount, address to) external;
    function getProject(uint256 projectId) external view returns (DataTypes.Project memory);
    function projectExists(uint256 projectId) external view returns (bool);
    function projectCount() external view returns (uint256);

    // Secondary Market
    function enableSecondaryMarket(uint256 projectId) external;
    function isSecondaryMarketEnabled(uint256 projectId) external view returns (bool);
    function getMarketPrice(uint256 projectId) external view returns (uint256);

    // Order Book
    function placeLimitOrder(
        uint256 projectId,
        DataTypes.OrderType orderType,
        uint256 shares,
        uint256 pricePerShare,
        uint256 expirationTime
    ) external returns (uint256 orderId);

    function cancelOrder(uint256 orderId) external;
    function getUserOrders(address user, uint256 projectId) external view returns (DataTypes.Order[] memory);
    function getTradingHistory(uint256 projectId, uint256 limit) external view returns (DataTypes.Trade[] memory);
    function getMarketStats(uint256 projectId) external view returns (DataTypes.MarketStats memory);

    // Admin Functions
    function setProjectVerified(uint256 projectId, bool _verified) external;
    function setPlatformFee(uint256 _platformFee) external;
    function setTradingFeeRate(uint256 _tradingFeeRate) external;
    function withdrawFees(address to, address token, uint256 amount) external;

    // Pause Functions
    function pauseProject(uint256 projectId) external;
    function unpauseProject(uint256 projectId) external;
    function isProjectPaused(uint256 projectId) external view returns (bool);

    // Events
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
    event SecondaryMarketEnabled(uint256 indexed projectId, address indexed orderBook, uint256 tradingFeeRate);
}
