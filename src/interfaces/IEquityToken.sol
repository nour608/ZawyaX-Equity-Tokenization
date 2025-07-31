// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEquityToken is IERC20 {
    // Minting (only factory)
    function mint(address to, uint256 amount) external;
    
    // Share management
    function setSharesToSell(uint256 _sharesToSell) external;
    function getSharesToSell() external view returns (uint256);
    
    // Pausable functionality
    function pause() external;
    function unpause() external;
    function paused() external view returns (bool);
    
    // Constants
    function TOTAL_SHARES() external view returns (uint256);
    function FACTORY() external view returns (address);
    
}