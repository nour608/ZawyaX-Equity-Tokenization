// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Factory} from "../src/Factory.sol";
import {CurrencyManager} from "../src/CurrencyManager.sol";
import {UserRegistry} from "../src/UserRegistry.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {
        _mint(msg.sender, 1000000 * 10 ** 6); // 1M USDC with 6 decimals
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SetupTestnetScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Load deployed addresses
        Factory factory = Factory(vm.envAddress("FACTORY_ADDRESS"));
        CurrencyManager currencyManager = CurrencyManager(vm.envAddress("CURRENCYMANAGER_ADDRESS"));
        UserRegistry userRegistry = UserRegistry(vm.envAddress("USERREGISTRY_ADDRESS"));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock USDC for testing
        console.log("Deploying Mock USDC...");
        MockUSDC mockUSDC = new MockUSDC();
        console.log("Mock USDC deployed at:", address(mockUSDC));

        // Add mock USDC to currency manager
        currencyManager.addCurrency(address(mockUSDC));
        console.log("Mock USDC added to currency manager");

        // Create test user profile
        userRegistry.createProfile(
            "Test Founder",
            true, // isFounder
            false, // isInvestor
            bytes32("QmTestFounderProfile")
        );
        console.log("Test founder profile created");

        // Mint some USDC to deployer for testing
        mockUSDC.mint(deployer, 100000 * 10 ** 6); // 100k USDC
        console.log("Minted 100k USDC to deployer for testing");

        vm.stopBroadcast();

        console.log("\n=== Testnet Setup Complete ===");
        console.log("Mock USDC:", address(mockUSDC));
        console.log("Use this token address for testing project creation");
    }
}
