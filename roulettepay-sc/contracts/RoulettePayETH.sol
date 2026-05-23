// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./base/BaseRoulettePay.sol";

/// @title RoulettePayETH
/// @notice RoulettePay contract for native ETH prizes on Arbitrum.
///         All business logic lives in BaseRoulettePay; this contract
///         adds ETH-specific funding and transfer implementations.
contract RoulettePayETH is BaseRoulettePay {

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param _supraRouter  Address of Supra VRF Router on Arbitrum
    /// @param _treasury     Platform fee treasury wallet
    /// @param _maxFeeETH    Max platform fee in wei (e.g. 0.0003 ether ≈ $1)
    constructor(
        address _supraRouter,
        address _treasury,
        uint256 _maxFeeETH
    )
        BaseRoulettePay(
            _supraRouter,
            _treasury,
            500,       // 5% platformFeeBps
            100,       // 1% gasReserveBps
            _maxFeeETH
        )
    {}

    // ─── Funding ──────────────────────────────────────────────────────────────

    /// @notice Fund an event with native ETH.
    ///         msg.value must cover prizePool + platformFee + gasReserve.
    /// @param eventId The event to fund.
    function fundEvent(uint256 eventId)
        external
        payable
        nonReentrant
        whenNotPaused
        eventExists(eventId)
    {
        require(_events[eventId].host == msg.sender, "ETH: only host can fund");
        require(msg.value > 0, "ETH: zero value");

        _applyFunding(eventId, msg.value);
    }

    // ─── Asset Transfer Hooks ─────────────────────────────────────────────────

    /// @dev Send ETH to recipient. Uses call to avoid gas limit issues.
    ///      CEI already applied by BaseRoulettePay before calling this.
    function _transferPrize(address to, uint256 amount) internal override {
        require(to != address(0), "ETH: zero recipient");
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /// @dev Refund unused ETH to host.
    function _refundAsset(address to, uint256 amount) internal override {
        require(to != address(0), "ETH: zero refund recipient");
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "ETH refund failed");
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function contractName() external pure override returns (string memory) {
        return "RoulettePayETH";
    }

    /// @notice Contract ETH balance (should equal sum of prizePool + gasReserve for active events)
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Fallback Guard ───────────────────────────────────────────────────────

    /// @dev Reject direct ETH deposits — use fundEvent() instead.
    receive() external payable {
        revert("Use fundEvent()");
    }

    fallback() external payable {
        revert("Use fundEvent()");
    }
}
