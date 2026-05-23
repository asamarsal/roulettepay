// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Generic ERC20 mock with 6 decimals (matches USDC/USDT on Arbitrum).
///         Used for both MockUSDC and MockUSDT in tests.
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Mint tokens to any address (test helper)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
