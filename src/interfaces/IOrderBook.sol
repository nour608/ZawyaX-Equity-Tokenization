// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "../utils/DataTypes.sol";

interface IOrderBook {
    function placeLimitOrder(
        uint256 projectId,
        DataTypes.OrderType orderType,
        uint256 shares,
        uint256 pricePerShare,
        uint256 expirationTime
    ) external returns (uint256 orderId);
    
    function cancelOrder(uint256 orderId) external;
    
    function getOrderBookDepth(uint256 projectId, uint256 depth)
        external
        view
        returns (
            uint256[] memory buyPrices,
            uint256[] memory sharesToBuy,
            uint256[] memory sellPrices,
            uint256[] memory sharesToSell
        );
    
    function getUserOrders(address user, uint256 projectId) 
        external 
        view 
        returns (DataTypes.Order[] memory);
    
    function getMarketPrice(uint256 projectId) external view returns (uint256);
    
    function matchOrdersForProject(uint256 projectId, uint256 feeRate) 
        external 
        returns (uint256 tradesExecuted, uint256 feeAmount);
}