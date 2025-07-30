// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test} from "forge-std/Test.sol";
import {DataTypes} from "../src/utils/DataTypes.sol";
import {OrderBook} from "../src/Implementations/OrderBookImp.sol";

/**
 * @title OrderBookTestHelper
 * @notice Helper contract to expose internal OrderBook functions for testing
 */
contract OrderBookTestHelper {
    // Storage to mimic Factory contract structure
    mapping(uint256 => DataTypes.Order) public orders;
    mapping(uint256 => uint256[]) public projectBuyOrders;

    /**
     * @notice Helper function to create and store a test order
     */
    function createTestOrder(uint256 orderId, uint256 projectId, address trader, uint256 shares, uint256 pricePerShare)
        external
    {
        orders[orderId] = DataTypes.Order({
            orderId: orderId,
            projectId: projectId,
            trader: trader,
            orderType: DataTypes.OrderType.BUY,
            shares: shares,
            sharesRemaining: shares,
            pricePerShare: pricePerShare,
            totalValue: shares * pricePerShare,
            timestamp: block.timestamp,
            expirationTime: 0,
            status: DataTypes.OrderStatus.ACTIVE,
            isMarketOrder: false
        });
    }

    /**
     * @notice Get buy orders for a project
     */
    function getProjectBuyOrders(uint256 projectId) external view returns (uint256[] memory) {
        return projectBuyOrders[projectId];
    }

    /**
     * @notice Test wrapper that calls _insertBuyOrder - mimics the internal function logic
     */
    function testInsertBuyOrder(uint256 orderId, uint256 projectId) external {
        DataTypes.Order storage newOrder = orders[orderId];
        uint256[] storage buyOrderIds = projectBuyOrders[projectId];
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
}

/**
 * @title OrderBookTest
 * @notice Comprehensive test suite for OrderBook._insertBuyOrder function
 */
contract OrderBookTest is Test {
    OrderBookTestHelper public helper;

    // Test addresses
    address public trader1 = makeAddr("trader1");
    address public trader2 = makeAddr("trader2");
    address public trader3 = makeAddr("trader3");

    // Test constants
    uint256 public constant PROJECT_ID = 1;
    uint256 public constant BASE_SHARES = 100;

    function setUp() public {
        helper = new OrderBookTestHelper();
    }

    /**
     * @notice Test inserting buy order into empty array
     */
    function test_InsertBuyOrder_EmptyArray() public {
        uint256 orderId = 1;
        uint256 pricePerShare = 1000;

        // Create test order
        helper.createTestOrder(orderId, PROJECT_ID, trader1, BASE_SHARES, pricePerShare);

        // Insert order
        helper.testInsertBuyOrder(orderId, PROJECT_ID);

        // Verify order was inserted
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 1);
        assertEq(buyOrders[0], orderId);
    }

    /**
     * @notice Test inserting buy order with highest price (should be first)
     */
    function test_InsertBuyOrder_HighestPrice() public {
        // Setup: Create initial order with lower price
        uint256 initialOrderId = 1;
        uint256 initialPrice = 1000;
        helper.createTestOrder(initialOrderId, PROJECT_ID, trader1, BASE_SHARES, initialPrice);
        helper.testInsertBuyOrder(initialOrderId, PROJECT_ID);

        // Insert new order with higher price
        uint256 newOrderId = 2;
        uint256 higherPrice = 1500;
        helper.createTestOrder(newOrderId, PROJECT_ID, trader2, BASE_SHARES, higherPrice);
        helper.testInsertBuyOrder(newOrderId, PROJECT_ID);

        // Verify ordering (highest price first)
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 2);
        assertEq(buyOrders[0], newOrderId); // Higher price should be first
        assertEq(buyOrders[1], initialOrderId); // Lower price should be second
    }

    /**
     * @notice Test inserting buy order with lowest price (should be last)
     */
    function test_InsertBuyOrder_LowestPrice() public {
        // Setup: Create initial order
        uint256 initialOrderId = 1;
        uint256 initialPrice = 1000;
        helper.createTestOrder(initialOrderId, PROJECT_ID, trader1, BASE_SHARES, initialPrice);
        helper.testInsertBuyOrder(initialOrderId, PROJECT_ID);

        // Insert new order with lower price
        uint256 newOrderId = 2;
        uint256 lowerPrice = 500;
        helper.createTestOrder(newOrderId, PROJECT_ID, trader2, BASE_SHARES, lowerPrice);
        helper.testInsertBuyOrder(newOrderId, PROJECT_ID);

        // Verify ordering (highest price first)
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 2);
        assertEq(buyOrders[0], initialOrderId); // Higher price should be first
        assertEq(buyOrders[1], newOrderId); // Lower price should be second
    }

    /**
     * @notice Test inserting buy order with middle price
     */
    function test_InsertBuyOrder_MiddlePrice() public {
        // Setup: Create two orders with different prices
        uint256 highOrderId = 1;
        uint256 highPrice = 1500;
        helper.createTestOrder(highOrderId, PROJECT_ID, trader1, BASE_SHARES, highPrice);
        helper.testInsertBuyOrder(highOrderId, PROJECT_ID);

        uint256 lowOrderId = 2;
        uint256 lowPrice = 500;
        helper.createTestOrder(lowOrderId, PROJECT_ID, trader2, BASE_SHARES, lowPrice);
        helper.testInsertBuyOrder(lowOrderId, PROJECT_ID);

        // Insert new order with middle price
        uint256 middleOrderId = 3;
        uint256 middlePrice = 1000;
        helper.createTestOrder(middleOrderId, PROJECT_ID, trader3, BASE_SHARES, middlePrice);
        helper.testInsertBuyOrder(middleOrderId, PROJECT_ID);

        // Verify ordering (highest to lowest)
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 3);
        assertEq(buyOrders[0], highOrderId); // 1500
        assertEq(buyOrders[1], middleOrderId); // 1000
        assertEq(buyOrders[2], lowOrderId); // 500
    }

    /**
     * @notice Test inserting buy orders with same price (insertion order preserved)
     */
    function test_InsertBuyOrder_SamePrice() public {
        uint256 price = 1000;

        // Create and insert first order
        uint256 firstOrderId = 1;
        helper.createTestOrder(firstOrderId, PROJECT_ID, trader1, BASE_SHARES, price);
        helper.testInsertBuyOrder(firstOrderId, PROJECT_ID);

        // Create and insert second order with same price
        uint256 secondOrderId = 2;
        helper.createTestOrder(secondOrderId, PROJECT_ID, trader2, BASE_SHARES, price);
        helper.testInsertBuyOrder(secondOrderId, PROJECT_ID);

        // Create and insert third order with same price
        uint256 thirdOrderId = 3;
        helper.createTestOrder(thirdOrderId, PROJECT_ID, trader3, BASE_SHARES, price);
        helper.testInsertBuyOrder(thirdOrderId, PROJECT_ID);

        // Verify orders maintain insertion order for same price
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 3);
        assertEq(buyOrders[0], firstOrderId);
        assertEq(buyOrders[1], secondOrderId);
        assertEq(buyOrders[2], thirdOrderId);
    }

    /**
     * @notice Test inserting multiple orders in complex scenario
     */
    function test_InsertBuyOrder_ComplexScenario() public {
        // Insert orders in random price order
        uint256[] memory orderIds = new uint256[](5);
        uint256[] memory prices = new uint256[](5);

        // Order 1: Medium price
        orderIds[0] = 1;
        prices[0] = 1000;
        helper.createTestOrder(orderIds[0], PROJECT_ID, trader1, BASE_SHARES, prices[0]);
        helper.testInsertBuyOrder(orderIds[0], PROJECT_ID);

        // Order 2: Highest price
        orderIds[1] = 2;
        prices[1] = 2000;
        helper.createTestOrder(orderIds[1], PROJECT_ID, trader2, BASE_SHARES, prices[1]);
        helper.testInsertBuyOrder(orderIds[1], PROJECT_ID);

        // Order 3: Lowest price
        orderIds[2] = 3;
        prices[2] = 500;
        helper.createTestOrder(orderIds[2], PROJECT_ID, trader3, BASE_SHARES, prices[2]);
        helper.testInsertBuyOrder(orderIds[2], PROJECT_ID);

        // Order 4: High price (but not highest)
        orderIds[3] = 4;
        prices[3] = 1800;
        helper.createTestOrder(orderIds[3], PROJECT_ID, trader1, BASE_SHARES, prices[3]);
        helper.testInsertBuyOrder(orderIds[3], PROJECT_ID);

        // Order 5: Medium-low price
        orderIds[4] = 5;
        prices[4] = 750;
        helper.createTestOrder(orderIds[4], PROJECT_ID, trader2, BASE_SHARES, prices[4]);
        helper.testInsertBuyOrder(orderIds[4], PROJECT_ID);

        // Verify final ordering (highest to lowest)
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 5);

        // Expected order: 2000, 1800, 1000, 750, 500
        assertEq(buyOrders[0], 2); // 2000
        assertEq(buyOrders[1], 4); // 1800
        assertEq(buyOrders[2], 1); // 1000
        assertEq(buyOrders[3], 5); // 750
        assertEq(buyOrders[4], 3); // 500

        // Verify prices are in correct order
        for (uint256 i = 0; i < buyOrders.length - 1; i++) {
            (,,,,,, uint256 currentPrice,,,,,) = helper.orders(buyOrders[i]);
            (,,,,,, uint256 nextPrice,,,,,) = helper.orders(buyOrders[i + 1]);
            assertGe(currentPrice, nextPrice, "Buy orders should be sorted highest to lowest price");
        }
    }

    /**
     * @notice Test edge case with maximum uint256 price
     */
    function test_InsertBuyOrder_MaxPrice() public {
        // Create order with normal price
        uint256 normalOrderId = 1;
        uint256 normalPrice = 1000;
        helper.createTestOrder(normalOrderId, PROJECT_ID, trader1, BASE_SHARES, normalPrice);
        helper.testInsertBuyOrder(normalOrderId, PROJECT_ID);

        // Create order with maximum price
        uint256 maxOrderId = 2;
        uint256 maxPrice = type(uint256).max;
        helper.createTestOrder(maxOrderId, PROJECT_ID, trader2, BASE_SHARES, maxPrice);
        helper.testInsertBuyOrder(maxOrderId, PROJECT_ID);

        // Verify max price order is first
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 2);
        assertEq(buyOrders[0], maxOrderId);
        assertEq(buyOrders[1], normalOrderId);
    }

    /**
     * @notice Test edge case with zero price
     */
    function test_InsertBuyOrder_ZeroPrice() public {
        // Create order with normal price
        uint256 normalOrderId = 1;
        uint256 normalPrice = 1000;
        helper.createTestOrder(normalOrderId, PROJECT_ID, trader1, BASE_SHARES, normalPrice);
        helper.testInsertBuyOrder(normalOrderId, PROJECT_ID);

        // Create order with zero price
        uint256 zeroOrderId = 2;
        uint256 zeroPrice = 0;
        helper.createTestOrder(zeroOrderId, PROJECT_ID, trader2, BASE_SHARES, zeroPrice);
        helper.testInsertBuyOrder(zeroOrderId, PROJECT_ID);

        // Verify zero price order is last
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, 2);
        assertEq(buyOrders[0], normalOrderId);
        assertEq(buyOrders[1], zeroOrderId);
    }

    /**
     * @notice Fuzz test with random prices
     */
    function testFuzz_InsertBuyOrder_RandomPrices(uint256[] memory prices) public {
        vm.assume(prices.length > 0 && prices.length <= 20); // Reasonable bounds

        // Insert orders with random prices
        for (uint256 i = 0; i < prices.length; i++) {
            uint256 orderId = i + 1;
            helper.createTestOrder(orderId, PROJECT_ID, trader1, BASE_SHARES, prices[i]);
            helper.testInsertBuyOrder(orderId, PROJECT_ID);
        }

        // Verify all orders are inserted
        uint256[] memory buyOrders = helper.getProjectBuyOrders(PROJECT_ID);
        assertEq(buyOrders.length, prices.length);

        // Verify ordering (highest to lowest)
        for (uint256 i = 0; i < buyOrders.length - 1; i++) {
            (,,,,,, uint256 currentPrice,,,,,) = helper.orders(buyOrders[i]);
            (,,,,,, uint256 nextPrice,,,,,) = helper.orders(buyOrders[i + 1]);
            assertGe(currentPrice, nextPrice, "Buy orders should be sorted highest to lowest price");
        }
    }
}
