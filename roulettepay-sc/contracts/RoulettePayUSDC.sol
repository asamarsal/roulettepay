// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./base/BaseRoulettePay.sol";

/// @title RoulettePayUSDC
/// @notice RoulettePay contract for USDC prizes on Arbitrum.
///         Uses SafeERC20 for all token interactions.
contract RoulettePayUSDC is BaseRoulettePay {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param _supraRouter Address of Supra VRF Router on Arbitrum
    /// @param _treasury    Platform fee treasury wallet
    /// @param _usdc        USDC token address on Arbitrum
    ///                     (Native USDC: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831)
    constructor(
        address _supraRouter,
        address _treasury,
        address _usdc
    )
        BaseRoulettePay(
            _supraRouter,
            _treasury,
            500,    // 5% platformFeeBps
            100,    // 1% gasReserveBps
            1e6     // max platform fee = 1 USDC (6 decimals)
        )
    {
        require(_usdc != address(0), "USDC: zero token address");
        usdc = IERC20(_usdc);
    }

    // ─── Funding ──────────────────────────────────────────────────────────────

    /// @notice Fund an event with USDC.
    ///         Host must approve this contract for `amount` USDC beforehand.
    /// @param eventId The event to fund.
    /// @param amount  Total USDC amount (prize + fees).
    function fundEvent(uint256 eventId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        eventExists(eventId)
    {
        require(_events[eventId].host == msg.sender, "USDC: only host can fund");
        require(amount > 0, "USDC: zero amount");

        // Pull tokens from host — requires prior approve()
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        _applyFunding(eventId, amount);
    }

    // ─── Asset Transfer Hooks ─────────────────────────────────────────────────

    /// @dev Transfer USDC prize to recipient.
    function _transferPrize(address to, uint256 amount) internal override {
        usdc.safeTransfer(to, amount);
    }

    /// @dev Refund USDC to host.
    function _refundAsset(address to, uint256 amount) internal override {
        usdc.safeTransfer(to, amount);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function contractName() external pure override returns (string memory) {
        return "RoulettePayUSDC";
    }

    /// @notice USDC balance held by this contract.
    function contractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
