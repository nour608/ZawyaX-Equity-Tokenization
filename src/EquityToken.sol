// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title EquityToken
/// @notice ERC-20 token representing project equity (shares) with pausable transfers
contract EquityToken is ERC20, Pausable, Ownable {
    uint256 public constant TOTAL_SHARES = 1_000_000 * 1e18; // total shares is 100% equity and the total supply of the token
    uint256 public sharesToSell; // shares to sell is the amount of shares that will be sold to the public
    address public immutable FACTORY;

    // Events
    event FactoryAdminSet(address indexed admin);

    modifier onlyFactory() {
        _onlyFactory();
        _;
    }

    /// @param initialOwner Address that will own this token contract (project developer)
    /// @param SharesToSell Total share supply (whole units, no decimals)
    constructor(
        string memory _name,
        string memory _symbol,
        address initialOwner,
        address _factory,
        uint256 SharesToSell,
        uint256 _platformFee
    ) Ownable(initialOwner) ERC20(_name, _symbol) {
        require(SharesToSell <= TOTAL_SHARES, "Shares to sell must be less than or equal to total shares");
        sharesToSell = SharesToSell;
        FACTORY = _factory;
        require(FACTORY != address(0), "Factory address cannot be 0");
        _mint(FACTORY, _platformFee);
        _mint(initialOwner, TOTAL_SHARES - sharesToSell - _platformFee);
        _pause(); // pause the token transfers
    }

    function mint(address to, uint256 amount) public onlyFactory {
        require(amount <= sharesToSell, "EquityToken: Max supply exceeded");
        _mint(to, amount);
        sharesToSell -= amount;
    }

    function setSharesToSell(uint256 _sharesToSell) external onlyOwner {
        require(_sharesToSell <= TOTAL_SHARES, "Shares to sell must be less than or equal to total shares");
        require(_sharesToSell > sharesToSell, "Shares to sell must be greater than the current shares to sell");
        sharesToSell += _sharesToSell;
        _burn(msg.sender, _sharesToSell);
    }

    /**
     *
     *            Transfer Functionality            *
     *
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    /**
     *
     *            Pausable Functionality            *
     *
     */

    /// @notice Pause token transfers (only owner or factory)
    function pause() external {
        require(msg.sender == owner() || msg.sender == FACTORY, "Only owner or factory can pause");
        _pause();
    }

    /// @notice Unpause token transfers (only owner or factory)
    function unpause() external {
        require(msg.sender == owner() || msg.sender == FACTORY, "Only owner or factory can unpause");
        _unpause();
    }

    /**
     *
     *                 Internal functions            *
     *
     */
    function _onlyFactory() internal view {
        require(msg.sender == FACTORY, "Only factory can call this function");
    }
}
