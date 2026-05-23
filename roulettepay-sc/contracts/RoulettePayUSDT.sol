// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./base/BaseRoulettePay.sol";

/// @title RoulettePayUSDT
/// @notice RoulettePay contract for USDT prizes on Arbitrum.
///         USDT may have non-standard ERC20 return values; SafeERC20 handles this.
contract RoulettePayUSDT is BaseRoulettePay {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20 public immutable usdt;

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param _supraRouter Address of Supra VRF Router on Arbitrum
    /// @param _treasury    Platform fee treasury wallet
    /// @param _usdt        USDT token address on Arbitrum
    ///                     (Bridged USDT: 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9)
    constructor(
        address _supraRouter,
        address _treasury,
        address _usdt
    )
        BaseRoulettePay(
            _supraRouter,
            _treasury,
            500,    // 5% platformFeeBps
            100,    // 1% gasReserveBps
            1e6     // max platform fee = 1 USDT (6 decimals)
        )
    {
        require(_usdt != address(0), "USDT: zero token address");
        usdt = IERC20(_usdt);
    }

    // ─── Funding ──────────────────────────────────────────────────────────────

    /// @notice Fund an event with USDT.
    ///         Host must approve this contract for `amount` USDT beforehand.
    ///         Note: USDT on some chains requires allowance reset to 0 before re-approving.
    /// @param eventId The event to fund.
    /// @param amount  Total USDT amount (prize + fees).
    function fundEvent(uint256 eventId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        eventExists(eventId)
    {
        require(_events[eventId].host == msg.sender, "USDT: only host can fund");
        require(amount > 0, "USDT: zero amount");

        // SafeERC20 handles USDT non-standard return values
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        _applyFunding(eventId, amount);
    }

    // ─── Asset Transfer Hooks ─────────────────────────────────────────────────

    /// @dev Transfer USDT prize to recipient.
    function _transferPrize(address to, uint256 amount) internal override {
        usdt.safeTransfer(to, amount);
    }

    /// @dev Refund USDT to host.
    function _refundAsset(address to, uint256 amount) internal override {
        usdt.safeTransfer(to, amount);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function contractName() external pure override returns (string memory) {
        return "RoulettePayUSDT";
    }

    /// @notice USDT balance held by this contract.
    function contractBalance() external view returns (uint256) {
        return usdt.balanceOf(address(this));
    }
}
