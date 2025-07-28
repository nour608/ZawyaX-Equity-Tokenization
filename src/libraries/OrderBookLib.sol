// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "../utils/DataTypes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title OrderBookLib
 * @notice Library containing order book logic for the Factory contract
 * @dev All functions operate on Factory's storage
 */
library OrderBookLib {
    using SafeERC20 for IERC20;

    // Events
    event OrderPlaced(uint256 indexed orderId, uint256 indexed projectId, address indexed trader, DataTypes.OrderType orderType, uint256 shares, uint256 price);
    event OrderFilled(uint256 indexed orderId, uint256 sharesFilled, uint256 sharesRemaining);
    event OrderCancelled(uint256 indexed orderId);
    event TradeExecuted(uint256 indexed tradeId, uint256 indexed projectId, address buyer, address seller, uint256 shares, uint256 price);
    event MarketStatsUpdated(uint256 indexed projectId, uint256 lastPrice, uint256 volume24h);

    /**
     * @notice Place a limit order
     */
    function placeLimitOrder(
        mapping(uint256 => DataTypes.Project) storage projects,
        mapping(uint256 => DataTypes.Order) storage orders,
        mapping(address => uint256[]) storage userOrders,
        mapping(uint256 => uint256[]) storage projectBuyOrders,
        mapping(uint256 => uint256[]) storage projectSellOrders,
        uint256 projectId,
        DataTypes.OrderType orderType,
        uint256 shares,
        uint256 pricePerShare,
        uint256 expirationTime,
        uint256 orderCounter
    ) external returns (uint256 orderId) {
        DataTypes.Project storage project = projects[projectId];
        require(project.exists, "Project does not exist");
        require(project.secondaryMarketEnabled, "Secondary market disabled");
        require(shares > 0, "Shares must be greater than 0");
        require(pricePerShare > 0, "Price must be greater than 0");
        require(expirationTime == 0 || expirationTime > block.timestamp, "Invalid expiration");
        
        // Generate unique order ID using timestamp + project + user
        orderId = uint256(keccak256(abi.encodePacked(block.timestamp, projectId, msg.sender, orderCounter)));
        
        // Create order
        DataTypes.Order memory newOrder = DataTypes.Order({
            orderId: orderId,
            projectId: projectId,
            trader: msg.sender,
            orderType: orderType,
            shares: shares,
            sharesRemaining: shares,
            pricePerShare: pricePerShare,
            totalValue: shares * pricePerShare,
            timestamp: block.timestamp,
            expirationTime: expirationTime,
            status: DataTypes.OrderStatus.ACTIVE,
            isMarketOrder: false
        });
        
        // Lock tokens/funds
        if (orderType == DataTypes.OrderType.BUY) {
            uint256 totalCost = shares * pricePerShare;
            IERC20(project.purchaseToken).safeTransferFrom(msg.sender, address(this), totalCost);
            _insertBuyOrder(orderId, projectBuyOrders[projectId], orders);
        } else {
            IERC20(project.equityToken).safeTransferFrom(msg.sender, address(this), shares);
            _insertSellOrder(orderId, projectSellOrders[projectId], orders);
        }
        
        orders[orderId] = newOrder;
        userOrders[msg.sender].push(orderId);
        
        emit OrderPlaced(orderId, projectId, msg.sender, orderType, shares, pricePerShare);
        
        return orderId;
    }

    /**
     * @notice Cancel an order
     */
    function cancelOrder(
        mapping(uint256 => DataTypes.Project) storage projects,
        mapping(uint256 => DataTypes.Order) storage orders,
        mapping(uint256 => uint256[]) storage projectBuyOrders,
        mapping(uint256 => uint256[]) storage projectSellOrders,
        uint256 orderId
    ) external {
        DataTypes.Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not your order");
        require(order.status == DataTypes.OrderStatus.ACTIVE || order.status == DataTypes.OrderStatus.PARTIALLY_FILLED, "Order not cancellable");
        
        DataTypes.Project storage project = projects[order.projectId];
        
        // Return locked tokens/funds
        if (order.orderType == DataTypes.OrderType.BUY) {
            uint256 refundAmount = order.sharesRemaining * order.pricePerShare;
            IERC20(project.purchaseToken).safeTransfer(order.trader, refundAmount);
            _removeBuyOrder(orderId, projectBuyOrders[order.projectId]);
        } else {
            IERC20(project.equityToken).safeTransfer(order.trader, order.sharesRemaining);
            _removeSellOrder(orderId, projectSellOrders[order.projectId]);
        }
        
        order.status = DataTypes.OrderStatus.CANCELLED;
        emit OrderCancelled(orderId);
    }

    /**
     * @notice Match orders for a specific project
     */
    function matchOrdersForProject(
        mapping(uint256 => DataTypes.Project) storage projects,
        mapping(uint256 => DataTypes.Order) storage orders,
        mapping(uint256 => uint256[]) storage projectBuyOrders,
        mapping(uint256 => uint256[]) storage projectSellOrders,
        mapping(uint256 => DataTypes.Trade[]) storage projectTrades,
        mapping(uint256 => DataTypes.MarketStats) storage projectMarketStats,
        uint256 projectId,
        uint256 tradingFeeRate,
        uint256 tradeCounter
    ) external returns (uint256 tradesExecuted, uint256 feeAmount) {
        uint256[] storage buyOrderIds = projectBuyOrders[projectId];
        uint256[] storage sellOrderIds = projectSellOrders[projectId];
        
        tradesExecuted = 0;
        
        while (buyOrderIds.length > 0 && sellOrderIds.length > 0) {
            uint256 bestBuyId = buyOrderIds[0];
            uint256 bestSellId = sellOrderIds[0];
            
            DataTypes.Order storage buyOrder = orders[bestBuyId];
            DataTypes.Order storage sellOrder = orders[bestSellId];
            
            // Check if orders can be matched
            if (buyOrder.pricePerShare >= sellOrder.pricePerShare &&
                buyOrder.status == DataTypes.OrderStatus.ACTIVE &&
                sellOrder.status == DataTypes.OrderStatus.ACTIVE) {
                
                feeAmount = _executeTrade(
                    projects,
                    orders,
                    buyOrderIds,
                    sellOrderIds,
                    projectTrades,
                    projectMarketStats,
                    projectId,
                    bestBuyId,
                    bestSellId,
                    tradingFeeRate,
                    tradeCounter
                );
                tradesExecuted++;
            } else {
                break; // No more matches possible
            }
        }
    }

    /**
     * @notice Get order book depth for a project
     */
    function getOrderBookDepth(
        mapping(uint256 => DataTypes.Order) storage orders,
        mapping(uint256 => uint256[]) storage projectBuyOrders,
        mapping(uint256 => uint256[]) storage projectSellOrders,
        uint256 projectId,
        uint256 depth
    ) external view returns (
        uint256[] memory buyPrices,
        uint256[] memory buyShares,
        uint256[] memory sellPrices,
        uint256[] memory sellShares
    ) {
        uint256[] storage buyOrderIds = projectBuyOrders[projectId];
        uint256[] storage sellOrderIds = projectSellOrders[projectId];
        
        uint256 buyCount = buyOrderIds.length > depth ? depth : buyOrderIds.length;
        uint256 sellCount = sellOrderIds.length > depth ? depth : sellOrderIds.length;
        
        buyPrices = new uint256[](buyCount);
        buyShares = new uint256[](buyCount);
        sellPrices = new uint256[](sellCount);
        sellShares = new uint256[](sellCount);
        
        // Fill buy side (highest prices first)
        for (uint256 i = 0; i < buyCount; i++) {
            DataTypes.Order storage order = orders[buyOrderIds[i]];
            if (order.status == DataTypes.OrderStatus.ACTIVE) {
                buyPrices[i] = order.pricePerShare;
                buyShares[i] = order.sharesRemaining;
            }
        }
        
        // Fill sell side (lowest prices first)
        for (uint256 i = 0; i < sellCount; i++) {
            DataTypes.Order storage order = orders[sellOrderIds[i]];
            if (order.status == DataTypes.OrderStatus.ACTIVE) {
                sellPrices[i] = order.pricePerShare;
                sellShares[i] = order.sharesRemaining;
            }
        }
    }

    /**
     * @notice Get market price for a project
     */
    function getMarketPrice(
        mapping(uint256 => DataTypes.MarketStats) storage projectMarketStats,
        uint256 projectId
    ) external view returns (uint256) {
        return projectMarketStats[projectId].lastPrice;
    }

    /**
     * @notice Get user's orders for a project
     */
    function getUserOrders(
        mapping(uint256 => DataTypes.Order) storage orders,
        mapping(address => uint256[]) storage userOrders,
        address user,
        uint256 projectId
    ) external view returns (DataTypes.Order[] memory userProjectOrders) {
        uint256[] storage orderIds = userOrders[user];
        
        // Count orders for this project
        uint256 count = 0;
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].projectId == projectId && 
                (orders[orderIds[i]].status == DataTypes.OrderStatus.ACTIVE || 
                 orders[orderIds[i]].status == DataTypes.OrderStatus.PARTIALLY_FILLED)) {
                count++;
            }
        }
        
        // Fill array
        userProjectOrders = new DataTypes.Order[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < orderIds.length; i++) {
            DataTypes.Order storage order = orders[orderIds[i]];
            if (order.projectId == projectId && 
                (order.status == DataTypes.OrderStatus.ACTIVE || 
                 order.status == DataTypes.OrderStatus.PARTIALLY_FILLED)) {
                userProjectOrders[index] = order;
                index++;
            }
        }
    }

    // Internal helper functions
    function _insertBuyOrder(
        uint256 orderId,
        uint256[] storage buyOrderIds,
        mapping(uint256 => DataTypes.Order) storage orders
    ) internal {
        DataTypes.Order storage newOrder = orders[orderId];
        uint256 insertIndex = buyOrderIds.length;
        
        // Find insertion point (highest price first)
        for (uint256 i = 0; i < buyOrderIds.length; i++) {
            if (orders[buyOrderIds[i]].pricePerShare < newOrder.pricePerShare) {
                insertIndex = i;
                break;
            }
        }
        
        // Insert at the correct position
        buyOrderIds.push(0);
        for (uint256 i = buyOrderIds.length - 1; i > insertIndex; i--) {
            buyOrderIds[i] = buyOrderIds[i - 1];
        }
        buyOrderIds[insertIndex] = orderId;
    }

    function _insertSellOrder(
        uint256 orderId,
        uint256[] storage sellOrderIds,
        mapping(uint256 => DataTypes.Order) storage orders
    ) internal {
        DataTypes.Order storage newOrder = orders[orderId];
        uint256 insertIndex = sellOrderIds.length;
        
        // Find insertion point (lowest price first)
        for (uint256 i = 0; i < sellOrderIds.length; i++) {
            if (orders[sellOrderIds[i]].pricePerShare > newOrder.pricePerShare) {
                insertIndex = i;
                break;
            }
        }
        
        // Insert at the correct position
        sellOrderIds.push(0);
        for (uint256 i = sellOrderIds.length - 1; i > insertIndex; i--) {
            sellOrderIds[i] = sellOrderIds[i - 1];
        }
        sellOrderIds[insertIndex] = orderId;
    }

    function _removeBuyOrder(uint256 orderId, uint256[] storage buyOrderIds) internal {
        for (uint256 i = 0; i < buyOrderIds.length; i++) {
            if (buyOrderIds[i] == orderId) {
                for (uint256 j = i; j < buyOrderIds.length - 1; j++) {
                    buyOrderIds[j] = buyOrderIds[j + 1];
                }
                buyOrderIds.pop();
                break;
            }
        }
    }

    function _removeSellOrder(uint256 orderId, uint256[] storage sellOrderIds) internal {
        for (uint256 i = 0; i < sellOrderIds.length; i++) {
            if (sellOrderIds[i] == orderId) {
                for (uint256 j = i; j < sellOrderIds.length - 1; j++) {
                    sellOrderIds[j] = sellOrderIds[j + 1];
                }
                sellOrderIds.pop();
                break;
            }
        }
    }

    function _executeTrade(
        mapping(uint256 => DataTypes.Project) storage projects,
        mapping(uint256 => DataTypes.Order) storage orders,
        uint256[] storage buyOrderIds,
        uint256[] storage sellOrderIds,
        mapping(uint256 => DataTypes.Trade[]) storage projectTrades,
        mapping(uint256 => DataTypes.MarketStats) storage projectMarketStats,
        uint256 projectId,
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 tradingFeeRate,
        uint256 tradeCounter
    ) internal returns (uint256 feeAmount) {
        DataTypes.Order storage buyOrder = orders[buyOrderId];
        DataTypes.Order storage sellOrder = orders[sellOrderId];
        DataTypes.Project storage project = projects[projectId];
        
        uint256 tradedShares = buyOrder.sharesRemaining < sellOrder.sharesRemaining 
            ? buyOrder.sharesRemaining 
            : sellOrder.sharesRemaining;
        
        // Use seller's price (price improvement for buyer)
        uint256 tradePrice = sellOrder.pricePerShare;
        uint256 tradeValue = tradedShares * tradePrice;
        
        // Calculate fees
        uint256 fee = (tradeValue * tradingFeeRate) / 10000;
        uint256 sellerReceives = tradeValue - fee;
        feeAmount = fee;

        // Transfer tokens
        IERC20(project.equityToken).safeTransfer(buyOrder.trader, tradedShares);
        IERC20(project.purchaseToken).safeTransfer(sellOrder.trader, sellerReceives);
        
        // Refund excess to buyer if they paid more
        uint256 buyerPaid = tradedShares * buyOrder.pricePerShare;
        if (buyerPaid > tradeValue) {
            IERC20(project.purchaseToken).safeTransfer(buyOrder.trader, buyerPaid - tradeValue);
        }
        
        // Update order states
        buyOrder.sharesRemaining -= tradedShares;
        sellOrder.sharesRemaining -= tradedShares;
        
        if (buyOrder.sharesRemaining == 0) {
            buyOrder.status = DataTypes.OrderStatus.FILLED;
            _removeBuyOrder(buyOrderId, buyOrderIds);
        } else {
            buyOrder.status = DataTypes.OrderStatus.PARTIALLY_FILLED;
        }
        
        if (sellOrder.sharesRemaining == 0) {
            sellOrder.status = DataTypes.OrderStatus.FILLED;
            _removeSellOrder(sellOrderId, sellOrderIds);
        } else {
            sellOrder.status = DataTypes.OrderStatus.PARTIALLY_FILLED;
        }
        
        // Record trade
        uint256 tradeId = uint256(keccak256(abi.encodePacked(block.timestamp, projectId, buyOrderId, sellOrderId, tradeCounter)));
        DataTypes.Trade memory newTrade = DataTypes.Trade({
            tradeId: tradeId,
            buyOrderId: buyOrderId,
            sellOrderId: sellOrderId,
            buyer: buyOrder.trader,
            seller: sellOrder.trader,
            shares: tradedShares,
            pricePerShare: tradePrice,
            totalValue: tradeValue,
            timestamp: block.timestamp
        });
        
        projectTrades[projectId].push(newTrade);
        
        // Update market stats
        _updateMarketStats(projectMarketStats[projectId], tradePrice, tradeValue);
        
        emit TradeExecuted(tradeId, projectId, buyOrder.trader, sellOrder.trader, tradedShares, tradePrice);
        emit OrderFilled(buyOrderId, tradedShares, buyOrder.sharesRemaining);
        emit OrderFilled(sellOrderId, tradedShares, sellOrder.sharesRemaining);
    }

    function _updateMarketStats(
        DataTypes.MarketStats storage stats,
        uint256 price,
        uint256 volume
    ) internal {
        stats.lastPrice = price;
        stats.totalTrades++;
        stats.volume24h += volume; // Note: This needs proper 24h window tracking
        
        // Update high/low
        if (price > stats.highPrice24h || stats.highPrice24h == 0) {
            stats.highPrice24h = price;
        }
        if (price < stats.lowPrice24h || stats.lowPrice24h == 0) {
            stats.lowPrice24h = price;
        }
        
        // Update best bid/ask (would need order book access for this)
        stats.lastUpdateTime = block.timestamp;
        
        emit MarketStatsUpdated(stats.lastPrice, stats.lastPrice, stats.volume24h);
    }
} 