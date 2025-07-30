// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console2} from "forge-std/Test.sol";
import {CurrencyManager} from "../src/CurrencyManager.sol";
import {ICurrencyManager} from "../src/interfaces/ICurrencyManager.sol";

contract CurrencyManagerTests is Test {
    CurrencyManager public currencyManager;
    address public admin;
    address public user;
    address public currency1;
    address public currency2;
    address public currency3;

    event CurrencyWhitelisted(address indexed currency);
    event CurrencyRemoved(address indexed currency);

    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        currency1 = makeAddr("currency1");
        currency2 = makeAddr("currency2");
        currency3 = makeAddr("currency3");

        vm.startPrank(admin);
        currencyManager = new CurrencyManager();
        vm.stopPrank();
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsAdminRoles() public view {
        assertTrue(currencyManager.hasRole(currencyManager.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(currencyManager.hasRole(currencyManager.ADMIN_ROLE(), admin));
    }

    // ============ addCurrency Tests ============

    function test_AddCurrency_Success() public {
        vm.prank(admin);
        vm.expectEmit(true, false, false, false);
        emit CurrencyWhitelisted(currency1);
        currencyManager.addCurrency(currency1);

        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 1);
    }

    function test_AddCurrency_RevertWhenNotAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        currencyManager.addCurrency(currency1);
    }

    function test_AddCurrency_RevertWhenNullAddress() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CurrencyManager.CurrencyManagerError.selector, "Cannot be null address"));
        currencyManager.addCurrency(address(0));
    }

    function test_AddCurrency_RevertWhenAlreadyWhitelisted() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        
        vm.expectRevert(abi.encodeWithSelector(CurrencyManager.CurrencyManagerError.selector, "Already whitelisted"));
        currencyManager.addCurrency(currency1);
        vm.stopPrank();
    }

    function test_AddCurrency_MultipleCurrencies() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        currencyManager.addCurrency(currency3);
        vm.stopPrank();

        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
        assertTrue(currencyManager.isCurrencyWhitelisted(currency2));
        assertTrue(currencyManager.isCurrencyWhitelisted(currency3));
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 3);
    }

    // ============ removeCurrency Tests ============

    function test_RemoveCurrency_Success() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        
        vm.expectEmit(true, false, false, false);
        emit CurrencyRemoved(currency1);
        currencyManager.removeCurrency(currency1);
        vm.stopPrank();

        assertFalse(currencyManager.isCurrencyWhitelisted(currency1));
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 0);
    }

    function test_RemoveCurrency_RevertWhenNotAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        currencyManager.removeCurrency(currency1);
    }

    function test_RemoveCurrency_RevertWhenNotWhitelisted() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CurrencyManager.CurrencyManagerError.selector, "Not whitelisted"));
        currencyManager.removeCurrency(currency1);
    }

    function test_RemoveCurrency_RemoveAndReadd() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.removeCurrency(currency1);
        currencyManager.addCurrency(currency1);
        vm.stopPrank();

        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 1);
    }

    // ============ isCurrencyWhitelisted Tests ============

    function test_IsCurrencyWhitelisted_ReturnsTrue() public {
        vm.prank(admin);
        currencyManager.addCurrency(currency1);

        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
    }

    function test_IsCurrencyWhitelisted_ReturnsFalse() public view {
        assertFalse(currencyManager.isCurrencyWhitelisted(currency1));
    }

    function test_IsCurrencyWhitelisted_AfterRemoval() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.removeCurrency(currency1);
        vm.stopPrank();

        assertFalse(currencyManager.isCurrencyWhitelisted(currency1));
    }

    // ============ viewCountWhitelistedCurrencies Tests ============

    function test_ViewCountWhitelistedCurrencies_Empty() public view {
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 0);
    }

    function test_ViewCountWhitelistedCurrencies_WithCurrencies() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 1);
        
        currencyManager.addCurrency(currency2);
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 2);
        
        currencyManager.addCurrency(currency3);
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 3);
        vm.stopPrank();
    }

    function test_ViewCountWhitelistedCurrencies_AfterRemoval() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 2);
        
        currencyManager.removeCurrency(currency1);
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 1);
        vm.stopPrank();
    }

    // ============ viewWhitelistedCurrencies Tests ============

    function test_ViewWhitelistedCurrencies_Empty() public view {
        (address[] memory currencies, uint256 newCursor) = currencyManager.viewWhitelistedCurrencies(0, 10);
        
        assertEq(currencies.length, 0);
        assertEq(newCursor, 0);
    }

    function test_ViewWhitelistedCurrencies_SingleCurrency() public {
        vm.prank(admin);
        currencyManager.addCurrency(currency1);

        (address[] memory currencies, uint256 newCursor) = currencyManager.viewWhitelistedCurrencies(0, 10);
        
        assertEq(currencies.length, 1);
        assertEq(currencies[0], currency1);
        assertEq(newCursor, 1);
    }

    function test_ViewWhitelistedCurrencies_MultipleCurrencies() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        currencyManager.addCurrency(currency3);
        vm.stopPrank();

        (address[] memory currencies, uint256 newCursor) = currencyManager.viewWhitelistedCurrencies(0, 10);
        
        assertEq(currencies.length, 3);
        assertEq(currencies[0], currency1);
        assertEq(currencies[1], currency2);
        assertEq(currencies[2], currency3);
        assertEq(newCursor, 3);
    }

    function test_ViewWhitelistedCurrencies_Pagination() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        currencyManager.addCurrency(currency3);
        vm.stopPrank();

        // First page - size 2
        (address[] memory currencies1, uint256 cursor1) = currencyManager.viewWhitelistedCurrencies(0, 2);
        assertEq(currencies1.length, 2);
        assertEq(currencies1[0], currency1);
        assertEq(currencies1[1], currency2);
        assertEq(cursor1, 2);

        // Second page - size 2
        (address[] memory currencies2, uint256 cursor2) = currencyManager.viewWhitelistedCurrencies(2, 2);
        assertEq(currencies2.length, 1);
        assertEq(currencies2[0], currency3);
        assertEq(cursor2, 3);
    }

    function test_ViewWhitelistedCurrencies_CursorBeyondTotal() public {
        vm.prank(admin);
        currencyManager.addCurrency(currency1);

        (address[] memory currencies, uint256 newCursor) = currencyManager.viewWhitelistedCurrencies(5, 10);
        
        assertEq(currencies.length, 0);
        assertEq(newCursor, 5);
    }

    function test_ViewWhitelistedCurrencies_SizeLargerThanRemaining() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        vm.stopPrank();

        (address[] memory currencies, uint256 newCursor) = currencyManager.viewWhitelistedCurrencies(1, 10);
        
        assertEq(currencies.length, 1);
        assertEq(currencies[0], currency2);
        assertEq(newCursor, 2);
    }

    // ============ Integration Tests ============

    function test_Integration_AddRemoveMultipleCurrencies() public {
        vm.startPrank(admin);
        
        // Add currencies
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        currencyManager.addCurrency(currency3);
        
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 3);
        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
        assertTrue(currencyManager.isCurrencyWhitelisted(currency2));
        assertTrue(currencyManager.isCurrencyWhitelisted(currency3));
        
        // Remove middle currency
        currencyManager.removeCurrency(currency2);
        
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 2);
        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
        assertFalse(currencyManager.isCurrencyWhitelisted(currency2));
        assertTrue(currencyManager.isCurrencyWhitelisted(currency3));
        
        // Add currency2 back
        currencyManager.addCurrency(currency2);
        
        assertEq(currencyManager.viewCountWhitelistedCurrencies(), 3);
        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
        assertTrue(currencyManager.isCurrencyWhitelisted(currency2));
        assertTrue(currencyManager.isCurrencyWhitelisted(currency3));
        
        vm.stopPrank();
    }

    function test_Integration_ViewCurrenciesAfterOperations() public {
        vm.startPrank(admin);
        
        // Add currencies
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        currencyManager.addCurrency(currency3);
        
        // View all currencies
        (address[] memory currencies, ) = currencyManager.viewWhitelistedCurrencies(0, 10);
        assertEq(currencies.length, 3);
        
        // Remove one currency
        currencyManager.removeCurrency(currency2);
        
        // View remaining currencies
        (address[] memory remainingCurrencies, ) = currencyManager.viewWhitelistedCurrencies(0, 10);
        assertEq(remainingCurrencies.length, 2);
        assertEq(remainingCurrencies[0], currency1);
        assertEq(remainingCurrencies[1], currency3);
        
        vm.stopPrank();
    }

    // ============ Access Control Tests ============

    function test_AccessControl_AdminRole() public view {
        assertTrue(currencyManager.hasRole(currencyManager.ADMIN_ROLE(), admin));
        assertFalse(currencyManager.hasRole(currencyManager.ADMIN_ROLE(), user));
    }

    function test_AccessControl_GrantRole() public {
        vm.startPrank(admin);
        currencyManager.grantRole(currencyManager.ADMIN_ROLE(), user);
        vm.stopPrank();
        
        assertTrue(currencyManager.hasRole(currencyManager.ADMIN_ROLE(), user));
        
        // User can now add currency
        vm.prank(user);
        currencyManager.addCurrency(currency1);
        assertTrue(currencyManager.isCurrencyWhitelisted(currency1));
    }

    function test_AccessControl_RevokeRole() public {
        vm.startPrank(admin);
        currencyManager.grantRole(currencyManager.ADMIN_ROLE(), user);
        currencyManager.revokeRole(currencyManager.ADMIN_ROLE(), user);
        vm.stopPrank();
        
        assertFalse(currencyManager.hasRole(currencyManager.ADMIN_ROLE(), user));
        
        // User can no longer add currency
        vm.prank(user);
        vm.expectRevert();
        currencyManager.addCurrency(currency1);
    }

    // ============ Gas Optimization Tests ============

    function test_Gas_AddCurrency() public {
        vm.prank(admin);
        uint256 gasBefore = gasleft();
        currencyManager.addCurrency(currency1);
        uint256 gasUsed = gasBefore - gasleft();
        
        console2.log("Gas used for addCurrency:", gasUsed);
        assertTrue(gasUsed > 0);
    }

    function test_Gas_RemoveCurrency() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        
        uint256 gasBefore = gasleft();
        currencyManager.removeCurrency(currency1);
        uint256 gasUsed = gasBefore - gasleft();
        
        console2.log("Gas used for removeCurrency:", gasUsed);
        assertTrue(gasUsed > 0);
        vm.stopPrank();
    }

    function test_Gas_ViewCurrencies() public {
        vm.startPrank(admin);
        currencyManager.addCurrency(currency1);
        currencyManager.addCurrency(currency2);
        currencyManager.addCurrency(currency3);
        vm.stopPrank();

        uint256 gasBefore = gasleft();
        currencyManager.viewWhitelistedCurrencies(0, 10);
        uint256 gasUsed = gasBefore - gasleft();
        
        console2.log("Gas used for viewWhitelistedCurrencies:", gasUsed);
        assertTrue(gasUsed > 0);
    }
}
