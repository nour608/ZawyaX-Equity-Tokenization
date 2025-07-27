// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title EquityToken
/// @notice ERC-20 token representing project equity (shares) with pausable transfers
contract EquityToken is ERC20, ERC20Pausable, Ownable {
    uint256 public totalShares = 1_000_000; // total shares is 100% equity and the total supply of the token
    uint256 public sharesToSell; // shares to sell is the amount of shares that will be sold to the public
    address public factory;
    
    // Factory admin can pause/unpause
    address public factoryAdmin;

    // Events
    event FactoryAdminSet(address indexed admin);

    /// @param initialOwner Address that will own this token contract (project developer)
    /// @param SharesToSell Total share supply (whole units, no decimals)
    constructor(address initialOwner, address _factory, uint256 SharesToSell, string memory _name, string memory _symbol) Ownable(initialOwner)
        ERC20(_name, _symbol)
    {
        require(SharesToSell <= totalShares, "Shares to sell must be less than or equal to total shares");
        sharesToSell = SharesToSell;
        factory = _factory;
        _mint(factory, sharesToSell);
        _mint(initialOwner, totalShares - sharesToSell);
    }

    function setSharesToSell(uint256 _sharesToSell) external onlyOwner {
        require(_sharesToSell <= totalShares, "Shares to sell must be less than or equal to total shares");
        require(_sharesToSell > sharesToSell, "Shares to sell must be greater than the current shares to sell");
        sharesToSell = _sharesToSell;
        transfer(factory, _sharesToSell - sharesToSell);
    }

    /************************************************
     *            Pausable Functionality            *
     *************************************************/

    /// @notice Set factory admin (only callable by factory)
    /// @param admin Address to set as factory admin
    function setFactoryAdmin(address admin) external {
        require(msg.sender == factory, "Only factory can set admin");
        factoryAdmin = admin;
        emit FactoryAdminSet(admin);
    }

    /// @notice Pause token transfers (only owner or factory admin)
    function pause() external {
        require(msg.sender == owner() || msg.sender == factoryAdmin, "Only owner or factory admin can pause");
        _pause();
    }

    /// @notice Unpause token transfers (only owner or factory admin)
    function unpause() external {
        require(msg.sender == owner() || msg.sender == factoryAdmin, "Only owner or factory admin can unpause");
        _unpause();
    }

    /// @notice Override required by Solidity for multiple inheritance
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}