// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title EquityToken
/// @notice ERC-20 token representing project equity (shares)
contract EquityToken is ERC20, Ownable {
    uint256 public totalShares = 1_000_000; // total shares is 100% equity and the total supply of the token
    uint256 public sharesToSell; // shares to sell is the amount of shares that will be sold to the public
    address public factory;

    /// @param initialOwner Address that will own this token contract (project developer)
    /// @param SharesToSell Total share supply (whole units, no decimals)
    constructor(address initialOwner, address _factory, uint256 SharesToSell, string memory _name, string memory _symbol) Ownable(initialOwner)
        ERC20(_name, _symbol)
    {
        require(sharesToSell <= totalShares, "Shares to sell must be less than or equal to total shares");
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

}