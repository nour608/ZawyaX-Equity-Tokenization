// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {Factory} from "../src/Factory.sol";
import {DataTypes} from "../src/utils/DataTypes.sol";
import {EquityToken} from "../src/EquityToken.sol";
import {UserRegistry} from "../src/UserRegistry.sol";
import {CurrencyManager} from "../src/CurrencyManager.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, 1000000 * 10 ** decimals_);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title FactoryTest
 * @notice Comprehensive test suite for Factory contract
 */
contract FactoryTest is Test {
    Factory public factory;
    UserRegistry public userRegistry;
    CurrencyManager public currencyManager;
    MockERC20 public usdc;
    MockERC20 public usdt;

    // Test addresses
    address public admin = makeAddr("admin");
    address public founder1 = makeAddr("founder1");
    address public founder2 = makeAddr("founder2");
    address public investor1 = makeAddr("investor1");
    address public investor2 = makeAddr("investor2");

    // Test constants
    uint256 public constant PLATFORM_FEE = 500; // 5%
    uint256 public constant TRADING_FEE_RATE = 25; // 0.25%
    uint256 public constant INITIAL_USDC_SUPPLY = 1000000e6; // 1M USDC
    uint256 public constant INITIAL_USDT_SUPPLY = 1000000e6; // 1M USDT

    // Project test data
    bytes32 public constant TEST_IPFS_CID = keccak256("QmTestHash");
    uint256 public constant TEST_VALUATION = 1000000e18; // $1M USD
    uint256 public constant TEST_SHARES_TO_SELL = 100000e18; // 100k shares  // @alqaqa : check this
    string public constant TEST_PROJECT_NAME = "TestProject";
    string public constant TEST_PROJECT_SYMBOL = "TEST";

    uint256 public constant PLUS_ONE = 1_000_001 * 1e18;

    function setUp() public {
        vm.startPrank(admin);

        // Deploy UserRegistry
        userRegistry = new UserRegistry();

        // Deploy CurrencyManager
        currencyManager = new CurrencyManager();

        // Deploy mock tokens
        usdc = new MockERC20("USD Coin", "USDC", 6);
        usdt = new MockERC20("Tether USD", "USDT", 6);

        // Whitelist currencies
        currencyManager.addCurrency(address(usdc));
        currencyManager.addCurrency(address(usdt));

        // Deploy Factory with proper parameters
        factory = new Factory(address(userRegistry), address(currencyManager), PLATFORM_FEE, TRADING_FEE_RATE);

        vm.stopPrank();

        // Setup initial token balances for test users
        setupUserBalances();

        // Register test users
        setupUserProfiles();
    }

    function setupUserBalances() internal {
        // Give USDC to test users
        deal(address(usdc), founder1, INITIAL_USDC_SUPPLY);
        deal(address(usdc), founder2, INITIAL_USDC_SUPPLY);
        deal(address(usdc), investor1, INITIAL_USDC_SUPPLY);
        deal(address(usdc), investor2, INITIAL_USDC_SUPPLY);

        // Give USDT to test users
        deal(address(usdt), founder1, INITIAL_USDT_SUPPLY);
        deal(address(usdt), founder2, INITIAL_USDT_SUPPLY);
        deal(address(usdt), investor1, INITIAL_USDT_SUPPLY);
        deal(address(usdt), investor2, INITIAL_USDT_SUPPLY);
    }

    function setupUserProfiles() internal {
        // Register founders
        vm.prank(founder1);
        userRegistry.createProfile("Founder One", true, false, TEST_IPFS_CID);

        vm.prank(founder2);
        userRegistry.createProfile("Founder Two", true, false, TEST_IPFS_CID);

        // Register investors
        vm.prank(investor1);
        userRegistry.createProfile("Investor One", false, true, TEST_IPFS_CID);

        vm.prank(investor2);
        userRegistry.createProfile("Investor Two", false, true, TEST_IPFS_CID);
    }

    /*//////////////////////////////////////////////////////////////
                            BASIC TESTS
    //////////////////////////////////////////////////////////////*/

    function test_InitialState() public view {
        assertEq(factory.projectCounter(), 1);
        assertEq(factory.PLATFORM_FEE(), PLATFORM_FEE);
        assertEq(factory.TRADING_FEE_RATE(), TRADING_FEE_RATE);
        assertEq(address(factory.userRegistry()), address(userRegistry));
        assertEq(address(factory.currencyManager()), address(currencyManager));
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(factory.hasRole(factory.ADMIN_ROLE(), admin));
    }

    // Test Pass
    function test_CreateProject() public {
        vm.startPrank(founder1);

        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        vm.stopPrank();

        // Verify project was created
        assertEq(projectId, 1);
        assertEq(factory.projectCounter(), 2);
        assertTrue(factory.projectExists(projectId));

        // Get project details
        DataTypes.Project memory project = factory.getProject(projectId);
        console.log("project.founder", project.founder);
        console.log("Project name:", project.name);
        assertEq(project.founder, founder1);
        assertEq(project.purchaseToken, address(usdc));
        assertEq(project.valuationUSD, TEST_VALUATION);
        assertEq(project.totalShares, factory.TOTAL_SHARES());
        assertEq(project.availableSharesToSell, TEST_SHARES_TO_SELL);
        assertEq(project.sharesSold, 0);
        assertEq(project.availableFunds, 0);
        assertEq(project.ipfsCID, TEST_IPFS_CID);
        assertTrue(project.exists);
        assertFalse(project.verified);
        assertFalse(project.secondaryMarketEnabled);
        assertTrue(project.equityToken != address(0));

        // Verify equity token was deployed correctly
        EquityToken equityToken = EquityToken(project.equityToken);
        assertEq(equityToken.name(), string(abi.encodePacked(TEST_PROJECT_NAME, " Equity Token")));
        console.log("equityToken.name()", equityToken.name());
        assertEq(equityToken.symbol(), TEST_PROJECT_SYMBOL);
        assertEq(equityToken.owner(), founder1);
    }

    function test_CreateProject_RevertInvalidParams() public {
        vm.startPrank(founder1);

        // Should revert with zero valuation
        vm.expectRevert("Valuation must be greater than 0");
        factory.createProject(
            TEST_IPFS_CID, 0, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Should revert with zero shares
        vm.expectRevert("Shares must be greater than 0");
        factory.createProject(TEST_IPFS_CID, TEST_VALUATION, 0, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL);

        // Should revert with too many shares
        vm.expectRevert("Shares must be less than or equal to total shares");
        factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, PLUS_ONE, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Should revert with non-whitelisted token
        MockERC20 nonWhitelistedToken = new MockERC20("NonWhitelisted", "NW", 18);
        vm.expectRevert("Purchase token not whitelisted");
        factory.createProject(
            TEST_IPFS_CID,
            TEST_VALUATION,
            TEST_SHARES_TO_SELL,
            address(nonWhitelistedToken),
            TEST_PROJECT_NAME,
            TEST_PROJECT_SYMBOL
        );

        vm.stopPrank();
    }

    function test_BuyShares() public {
        // Create project first
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Get project details for price calculation
        DataTypes.Project memory project = factory.getProject(projectId);
        uint256 sharesToBuy = 1000e18; // 1000 shares
        uint256 expectedCost = (sharesToBuy * project.pricePerShare) / 1e18;

        // Approve USDC spending
        vm.prank(investor1);
        usdc.approve(address(factory), expectedCost);

        // Record initial balances
        uint256 initialUsdcBalance = usdc.balanceOf(investor1);
        uint256 initialFactoryBalance = usdc.balanceOf(address(factory));

        // Buy shares
        vm.prank(investor1);
        factory.buyShares(projectId, sharesToBuy);

        // Verify balances changed correctly
        assertEq(usdc.balanceOf(investor1), initialUsdcBalance - expectedCost);
        assertEq(usdc.balanceOf(address(factory)), initialFactoryBalance + expectedCost);

        // Verify equity tokens were minted
        EquityToken equityToken = EquityToken(project.equityToken);
        assertEq(equityToken.balanceOf(investor1), sharesToBuy);

        // Verify project state updated
        DataTypes.Project memory updatedProject = factory.getProject(projectId);
        assertEq(updatedProject.sharesSold, sharesToBuy);
        assertEq(updatedProject.availableSharesToSell, TEST_SHARES_TO_SELL - sharesToBuy);
        assertEq(updatedProject.availableFunds, expectedCost);
    }

    function test_BuyShares_RevertInvalidParams() public {
        // Create project first
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        vm.startPrank(investor1);

        // Should revert with zero shares
        vm.expectRevert("Must buy at least 1 share");
        factory.buyShares(projectId, 0);

        // Should revert with too many shares
        vm.expectRevert("Not enough shares to sell");
        factory.buyShares(projectId, TEST_SHARES_TO_SELL + 1);

        // Should revert for non-existent project
        vm.expectRevert("Project does not exist");
        factory.buyShares(999, 1000e18);

        vm.stopPrank();
    }

    function test_WithdrawFunds() public {
        // Create project and buy shares
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Investor buys shares
        DataTypes.Project memory project = factory.getProject(projectId);
        uint256 sharesToBuy = 1000e18;
        uint256 cost = (sharesToBuy * project.pricePerShare) / 1e18;

        vm.prank(investor1);
        usdc.approve(address(factory), cost);
        vm.prank(investor1);
        factory.buyShares(projectId, sharesToBuy);

        // Founder withdraws funds
        uint256 initialFounderBalance = usdc.balanceOf(founder1);
        uint256 initialAdminBalance = usdc.balanceOf(admin);
        uint256 withdrawAmount = cost / 2; // Withdraw half

        vm.startPrank(founder1);
        factory.withdrawFunds(projectId, withdrawAmount, founder1);

        // Verify withdrawal
        assertEq(usdc.balanceOf(founder1), initialFounderBalance + withdrawAmount);

        DataTypes.Project memory updatedProject = factory.getProject(projectId);
        assertEq(updatedProject.availableFunds, cost - withdrawAmount);
        vm.stopPrank();

        vm.startPrank(admin);
        factory.setProjectVerified(projectId, true);
        factory.withdrawFunds(projectId, withdrawAmount, address(0));
        assertEq(usdc.balanceOf(admin), initialAdminBalance + withdrawAmount);
        DataTypes.Project memory updatedProject2 = factory.getProject(projectId);
        assertEq(updatedProject2.availableFunds, 0);
        vm.stopPrank();
    }

    function test_WithdrawFunds_RevertNotFounder() public {
        // Create project
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Non-founder tries to withdraw
        vm.prank(founder2);
        vm.expectRevert("Not project founder");
        factory.withdrawFunds(projectId, 1000, founder2);
    }

    /*//////////////////////////////////////////////////////////////
                        SECONDARY MARKET TESTS
    //////////////////////////////////////////////////////////////*/

    function test_EnableSecondaryMarket() public {
        // Create project
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );
        EquityToken equityToken = EquityToken(factory.getProject(projectId).equityToken);
        vm.prank(founder1);
        equityToken.unpause();

        // Enable secondary market
        vm.prank(founder1);
        factory.enableSecondaryMarket(projectId);

        // Verify market is enabled
        assertTrue(factory.isSecondaryMarketEnabled(projectId));

        DataTypes.Project memory project = factory.getProject(projectId);
        assertTrue(project.secondaryMarketEnabled);
    }

    function test_EnableSecondaryMarket_RevertNotFounder() public {
        // Create project
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Unpause token first
        EquityToken equityToken = EquityToken(factory.getProject(projectId).equityToken);
        vm.prank(founder1);
        equityToken.unpause();

        // Non-founder tries to enable market
        vm.prank(founder2);
        vm.expectRevert("Only project founder or admin can call this function");
        factory.enableSecondaryMarket(projectId);
    }

    function test_EnableSecondaryMarket_RevertWhenPaused() public {
        // Create project
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Try to enable secondary market while token is paused
        vm.prank(founder1);
        vm.expectRevert("Project Equity Token Transfers are paused");
        factory.enableSecondaryMarket(projectId);
    }

    function test_EnableSecondaryMarket_RevertAlreadyEnabled() public {
        // Create project and enable market
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        EquityToken equityToken = EquityToken(factory.getProject(projectId).equityToken);
        vm.prank(founder1);
        equityToken.unpause();

        vm.prank(founder1);
        factory.enableSecondaryMarket(projectId);

        // Try to enable again
        vm.prank(founder1);
        vm.expectRevert("Market already enabled");
        factory.enableSecondaryMarket(projectId);
    }

    function test_GetMarketPrice_InitialPrice() public {
        // Create project
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        DataTypes.Project memory project = factory.getProject(projectId);
        uint256 marketPrice = factory.getMarketPrice(projectId);

        // Should return initial price when secondary market is not enabled
        assertEq(marketPrice, project.pricePerShare);
        console.log("Market Price :%e", marketPrice);
        console.log("pricePerShare Price :", project.pricePerShare);
    }

    function test_GetMarketPrice_WithSecondaryMarket() public {
        // Create project and enable secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        DataTypes.Project memory project = factory.getProject(projectId);
        uint256 marketPrice = factory.getMarketPrice(projectId);

        // Should return initial price when no trades have occurred
        assertEq(marketPrice, project.pricePerShare);
    }

    /*//////////////////////////////////////////////////////////////
                        ORDER BOOK TESTS
    //////////////////////////////////////////////////////////////*/

    function test_PlaceBuyOrder() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Give investor some equity tokens first
        setupInvestorWithShares(projectId, investor1, 1000e18);

        uint256 shares = 100e18;
        uint256 pricePerShare = 2e6; // $2 per share

        // Approve USDC for order
        vm.prank(investor2);
        usdc.approve(address(factory), shares * pricePerShare / 1e18);

        // Place buy order
        vm.prank(investor2);
        uint256 orderId = factory.placeLimitOrder(
            projectId,
            DataTypes.OrderType.BUY,
            shares,
            pricePerShare,
            0 // No expiration
        );

        // Verify order was created
        assertGt(orderId, 0);
        assertEq(factory.getUserOrders(investor2, projectId)[0].orderId, orderId);

        // Check order book depth
        (uint256[] memory buyPrices, uint256[] memory buyShares,,) = factory.getOrderBookDepth(projectId, 5);

        assertEq(buyPrices.length, 1);
        assertEq(buyPrices[0], pricePerShare);
        assertEq(buyShares[0], shares);
        console.log("buyPrices[0] :%e", buyPrices[0]);
        console.log("pricePerShare :%e", pricePerShare);
        console.log("shares :%e", buyShares[0]);
    }

    function test_PlaceSellOrder() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Give investor some equity tokens
        setupInvestorWithShares(projectId, investor1, 1000e18);

        uint256 shares = 100e18;
        uint256 pricePerShare = 2e6; // $2 per share

        // Approve equity tokens for order
        DataTypes.Project memory project = factory.getProject(projectId);
        EquityToken equityToken = EquityToken(project.equityToken);

        vm.prank(investor1);
        equityToken.approve(address(factory), shares);

        // Place sell order
        vm.prank(investor1);
        uint256 orderId = factory.placeLimitOrder(
            projectId,
            DataTypes.OrderType.SELL,
            shares,
            pricePerShare,
            0 // No expiration
        );

        // Verify order was created
        assertGt(orderId, 0);

        // Check order book depth
        (,, uint256[] memory sellPrices, uint256[] memory sellShares) = factory.getOrderBookDepth(projectId, 5);

        assertEq(sellPrices.length, 1);
        assertEq(sellPrices[0], pricePerShare);
        assertEq(sellShares[0], shares);
    }

    function test_OrderMatching_ExactMatch() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Setup investors with tokens
        setupInvestorWithShares(projectId, investor1, 1000e18);

        uint256 shares = 100e18;
        uint256 pricePerShare = 2e6; // $2 per share

        DataTypes.Project memory project = factory.getProject(projectId);
        EquityToken equityToken = EquityToken(project.equityToken);

        // Record initial balances BEFORE placing sell order
        uint256 seller_initial_usdc = usdc.balanceOf(investor1);
        uint256 buyer_initial_usdc = usdc.balanceOf(investor2);
        uint256 seller_initial_equity = equityToken.balanceOf(investor1);
        uint256 buyer_initial_equity = equityToken.balanceOf(investor2);

        // Place sell order first
        vm.prank(investor1);
        equityToken.approve(address(factory), shares);

        vm.prank(investor1);
        uint256 sellOrderId = factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, shares, pricePerShare, 0);

        // Place matching buy order
        vm.prank(investor2);
        usdc.approve(address(factory), shares * pricePerShare / 1e18);

        vm.prank(investor2);
        uint256 buyOrderId = factory.placeLimitOrder(projectId, DataTypes.OrderType.BUY, shares, pricePerShare, 0);

        // Verify trade occurred
        uint256 tradeCost = shares * pricePerShare / 1e18;
        uint256 tradingFee = (tradeCost * TRADING_FEE_RATE) / 10000;
        uint256 sellerReceives = tradeCost - tradingFee;

        // Check balances changed correctly
        assertEq(usdc.balanceOf(investor1), seller_initial_usdc + sellerReceives);
        assertEq(usdc.balanceOf(investor2), buyer_initial_usdc - tradeCost);
        assertEq(equityToken.balanceOf(investor1), seller_initial_equity - shares);
        assertEq(equityToken.balanceOf(investor2), buyer_initial_equity + shares);

        // Check trading history
        DataTypes.Trade[] memory trades = factory.getTradingHistory(projectId, 10);
        assertEq(trades.length, 1);
        assertEq(trades[0].shares, shares);
        assertEq(trades[0].pricePerShare, pricePerShare);
        assertEq(trades[0].buyer, investor2);
        assertEq(trades[0].seller, investor1);
    }

    function test_OrderMatching_PartialFill() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Setup investors with tokens
        setupInvestorWithShares(projectId, investor1, 1000e18);

        uint256 sellShares = 200e18;
        uint256 buyShares = 100e18; // Buy less than sell
        uint256 pricePerShare = 2e6;

        DataTypes.Project memory project = factory.getProject(projectId);
        EquityToken equityToken = EquityToken(project.equityToken);

        // Place large sell order
        vm.prank(investor1);
        equityToken.approve(address(factory), sellShares);

        vm.prank(investor1);
        factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, sellShares, pricePerShare, 0);

        // Place smaller buy order
        vm.prank(investor2);
        usdc.approve(address(factory), buyShares * pricePerShare / 1e18);

        vm.prank(investor2);
        factory.placeLimitOrder(projectId, DataTypes.OrderType.BUY, buyShares, pricePerShare, 0);

        // Check that only buyShares were traded
        DataTypes.Trade[] memory trades = factory.getTradingHistory(projectId, 10);
        assertEq(trades.length, 1);
        assertEq(trades[0].shares, buyShares);

        // Check remaining sell order in order book
        (,, uint256[] memory sellPrices, uint256[] memory sellSharesRemaining) = factory.getOrderBookDepth(projectId, 5);

        // Since orders are matched immediately, the sell order should be partially filled
        assertEq(sellPrices.length, 1);
        assertEq(sellSharesRemaining[0], sellShares - buyShares); // @alqaqa : check this, it's failing, i think the sellSharesRemaining is not updated correctly, I have solved it check the getOrderBookDepth() function
    }

    function test_CancelOrder() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Setup investor with tokens
        setupInvestorWithShares(projectId, investor1, 1000e18);

        uint256 shares = 100e18;
        uint256 pricePerShare = 2e6;

        DataTypes.Project memory project = factory.getProject(projectId);
        EquityToken equityToken = EquityToken(project.equityToken);

        // Place sell order
        vm.prank(investor1);
        equityToken.approve(address(factory), shares);

        vm.prank(investor1);
        uint256 orderId = factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, shares, pricePerShare, 0);

        // Verify order exists
        (,, uint256[] memory sellPrices,) = factory.getOrderBookDepth(projectId, 5);
        assertEq(sellPrices.length, 1);

        // Cancel order
        vm.prank(investor1);
        factory.cancelOrder(orderId);

        // Verify order is removed
        (,, sellPrices,) = factory.getOrderBookDepth(projectId, 5);
        assertEq(sellPrices.length, 0);
    }

    function test_GetUserOrders() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Setup investor with tokens
        setupInvestorWithShares(projectId, investor1, 1000e18);

        DataTypes.Project memory project = factory.getProject(projectId);
        EquityToken equityToken = EquityToken(project.equityToken);

        // Place multiple orders
        vm.startPrank(investor1);
        equityToken.approve(address(factory), 500e18);

        factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, 100e18, 2e6, 0);
        factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, 150e18, 2.5e6, 0);

        vm.stopPrank();

        // Get user orders
        DataTypes.Order[] memory userOrders = factory.getUserOrders(investor1, projectId);

        assertEq(userOrders.length, 2);
        assertEq(userOrders[0].trader, investor1);
        assertEq(userOrders[1].trader, investor1);
    }

    function test_GetMarketStats() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Execute a trade to generate stats
        setupInvestorWithShares(projectId, investor1, 1000e18);

        uint256 shares = 100e18;
        uint256 pricePerShare = 2e6;

        DataTypes.Project memory project = factory.getProject(projectId);
        EquityToken equityToken = EquityToken(project.equityToken);

        // Place and match orders
        vm.prank(investor1);
        equityToken.approve(address(factory), shares);

        vm.prank(investor1);
        factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, shares, pricePerShare, 0);

        vm.prank(investor2);
        usdc.approve(address(factory), shares * pricePerShare / 1e18);

        vm.prank(investor2);
        factory.placeLimitOrder(projectId, DataTypes.OrderType.BUY, shares, pricePerShare, 0);

        // Check market stats
        DataTypes.MarketStats memory stats = factory.getMarketStats(projectId);
        assertEq(stats.lastPrice, pricePerShare);
        assertEq(stats.totalTrades, 1);
        console.log("stats.lastPrice :%e", stats.lastPrice);
    }

    function test_MultipleOrderPriceOrdering() public {
        // Create project with secondary market
        uint256 projectId = createProjectWithSecondaryMarket();

        // Setup investors with tokens
        setupInvestorWithShares(projectId, investor1, 1000e18);

        DataTypes.Project memory project = factory.getProject(projectId);
        EquityToken equityToken = EquityToken(project.equityToken);

        // Place multiple sell orders at different prices
        vm.startPrank(investor1);
        equityToken.approve(address(factory), 500e18);

        factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, 100e18, 3e6, 0); // $3
        factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, 100e18, 2e6, 0); // $2
        factory.placeLimitOrder(projectId, DataTypes.OrderType.SELL, 100e18, 2.5e6, 0); // $2.5

        vm.stopPrank();

        // Place multiple buy orders at different prices
        vm.startPrank(investor2);
        usdc.approve(address(factory), 1000e6); // Approve enough USDC

        factory.placeLimitOrder(projectId, DataTypes.OrderType.BUY, 100e18, 1.5e6, 0); // $1.5
        factory.placeLimitOrder(projectId, DataTypes.OrderType.BUY, 100e18, 1.8e6, 0); // $1.8
        factory.placeLimitOrder(projectId, DataTypes.OrderType.BUY, 100e18, 1.2e6, 0); // $1.2

        vm.stopPrank();

        // Check order book depth - should be sorted properly
        (uint256[] memory buyPrices,, uint256[] memory sellPrices,) = factory.getOrderBookDepth(projectId, 10);

        // Buy orders should be sorted highest to lowest
        assertGe(buyPrices[1], buyPrices[0]);
        assertGe(buyPrices[1], buyPrices[2]);

        // Sell orders should be sorted lowest to highest
        assertLe(sellPrices[1], sellPrices[0]);
        assertLe(sellPrices[1], sellPrices[2]);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetPlatformFee() public {
        uint256 newFee = 300; // 3%

        vm.prank(admin);
        factory.setPlatformFee(newFee);

        assertEq(factory.PLATFORM_FEE(), newFee);
    }

    function test_SetTradingFeeRate() public {
        uint256 newRate = 50; // 0.5%

        vm.prank(admin);
        factory.setTradingFeeRate(newRate);

        assertEq(factory.TRADING_FEE_RATE(), newRate);
    }

    function test_SetTradingFeeRate_RevertTooHigh() public {
        vm.prank(admin);
        vm.expectRevert("Fee rate too high");
        factory.setTradingFeeRate(1001); // > 10%
    }

    function test_SetProjectVerified() public {
        // Create project
        vm.prank(founder1);
        uint256 projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Admin verifies project
        vm.prank(admin);
        factory.setProjectVerified(projectId, true);

        DataTypes.Project memory project = factory.getProject(projectId);
        assertTrue(project.verified);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function createProjectWithSecondaryMarket() internal returns (uint256 projectId) {
        // Create project
        vm.prank(founder1);
        projectId = factory.createProject(
            TEST_IPFS_CID, TEST_VALUATION, TEST_SHARES_TO_SELL, address(usdc), TEST_PROJECT_NAME, TEST_PROJECT_SYMBOL
        );

        // Unpause equity token
        EquityToken equityToken = EquityToken(factory.getProject(projectId).equityToken);
        vm.prank(founder1);
        equityToken.unpause();

        // Enable secondary market
        vm.prank(founder1);
        factory.enableSecondaryMarket(projectId);
    }

    function setupInvestorWithShares(uint256 projectId, address investor, uint256 sharesToBuy) internal {
        // Get project details
        DataTypes.Project memory project = factory.getProject(projectId);
        uint256 cost = (sharesToBuy * project.pricePerShare) / 1e18;

        // Approve and buy shares
        vm.prank(investor);
        usdc.approve(address(factory), cost);

        vm.prank(investor);
        factory.buyShares(projectId, sharesToBuy);
    }
}
