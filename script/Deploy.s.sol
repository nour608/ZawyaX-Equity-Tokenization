// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Factory} from "../src/Factory.sol";
import {CurrencyManager} from "../src/CurrencyManager.sol";
import {UserRegistry} from "../src/UserRegistry.sol";

contract DeployScript is Script {
    // // Configuration - adjust these before deployment
    // uint256 constant PLATFORM_FEE = 500; // 5% platform fee
    // uint256 constant TRADING_FEE = 25;   // 0.25% trading fee
    
    // // Common stablecoin addresses (adjust for target network)
    // address constant USDC_MAINNET = 0xA0b86a33E6b6eCF1d10dEf6F6C7d1F25Ec5a38fF;
    // address constant USDT_MAINNET = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    // address constant DAI_MAINNET = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    
    // // Sepolia testnet addresses
    // address constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    
    // function run() external {
    //     uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    //     address deployer = vm.addr(deployerPrivateKey);
        
    //     console.log("Deploying with account:", deployer);
    //     console.log("Account balance:", deployer.balance);
        
    //     vm.startBroadcast(deployerPrivateKey);
        
    //     // 1. Deploy UserRegistry
    //     console.log("Deploying UserRegistry...");
    //     UserRegistry userRegistry = new UserRegistry();
    //     console.log("UserRegistry deployed at:", address(userRegistry));
        
    //     // 2. Deploy CurrencyManager
    //     console.log("Deploying CurrencyManager...");
    //     CurrencyManager currencyManager = new CurrencyManager();
    //     console.log("CurrencyManager deployed at:", address(currencyManager));
        
    //     // 3. Deploy Factory
    //     console.log("Deploying Factory...");
    //     Factory factory = new Factory(
    //         address(userRegistry),
    //         address(currencyManager),
    //         PLATFORM_FEE,
    //         TRADING_FEE
    //     );
    //     console.log("Factory deployed at:", address(factory));
        
    //     // 4. Setup initial currencies (adjust based on network)
    //     console.log("Setting up initial currencies...");
    //     if (block.chainid == 1) { // Mainnet
    //         currencyManager.addCurrency(USDC_MAINNET);
    //         currencyManager.addCurrency(USDT_MAINNET);
    //         currencyManager.addCurrency(DAI_MAINNET);
    //         console.log("Added mainnet stablecoins");
    //     } else if (block.chainid == 11155111) { // Sepolia
    //         currencyManager.addCurrency(USDC_SEPOLIA);
    //         console.log("Added Sepolia USDC");
    //     }
        
    //     vm.stopBroadcast();
        
    //     // 5. Verify deployment
    //     console.log("\n=== Deployment Summary ===");
    //     console.log("Network Chain ID:", block.chainid);
    //     console.log("UserRegistry:", address(userRegistry));
    //     console.log("CurrencyManager:", address(currencyManager));
    //     console.log("Factory:", address(factory));
    //     console.log("Platform Fee:", PLATFORM_FEE, "basis points");
    //     console.log("Trading Fee:", TRADING_FEE, "basis points");
        
    //     // 6. Save deployment info to file
    //     string memory deploymentInfo = string(abi.encodePacked(
    //         "USERREGISTRY_ADDRESS=", vm.toString(address(userRegistry)), "\n",
    //         "CURRENCYMANAGER_ADDRESS=", vm.toString(address(currencyManager)), "\n",
    //         "FACTORY_ADDRESS=", vm.toString(address(factory)), "\n",
    //         "CHAIN_ID=", vm.toString(block.chainid), "\n",
    //         "DEPLOYER=", vm.toString(deployer), "\n"
    //     ));
        
    //     vm.writeFile("deployment.env", deploymentInfo);
    //     console.log("Deployment info saved to deployment.env");
    // }
}