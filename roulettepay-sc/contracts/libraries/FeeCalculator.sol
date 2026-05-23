// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title FeeCalculator
/// @notice Library for computing platform fee, gas reserve, and net prize pool
library FeeCalculator {
    uint16 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Calculate platform fee (capped by maxPlatformFee)
    /// @param amount Total deposit amount
    /// @param platformFeeBps Fee in basis points (e.g. 500 = 5%)
    /// @param maxPlatformFee Maximum fee cap in asset units
    function calculatePlatformFee(
        uint256 amount,
        uint16 platformFeeBps,
        uint256 maxPlatformFee
    ) internal pure returns (uint256 fee) {
        fee = (amount * platformFeeBps) / BPS_DENOMINATOR;
        if (fee > maxPlatformFee) {
            fee = maxPlatformFee;
        }
    }

    /// @notice Calculate gas reserve
    /// @param amount Total deposit amount
    /// @param gasReserveBps Gas reserve in basis points (e.g. 100 = 1%)
    function calculateGasReserve(
        uint256 amount,
        uint16 gasReserveBps
    ) internal pure returns (uint256) {
        return (amount * gasReserveBps) / BPS_DENOMINATOR;
    }

    /// @notice Calculate platform fee, gas reserve, and net prize pool together
    function calculateNetPrizePool(
        uint256 totalDeposit,
        uint16 platformFeeBps,
        uint16 gasReserveBps,
        uint256 maxPlatformFee
    )
        internal
        pure
        returns (
            uint256 platformFee,
            uint256 gasReserve,
            uint256 prizePool
        )
    {
        platformFee = calculatePlatformFee(totalDeposit, platformFeeBps, maxPlatformFee);
        gasReserve = calculateGasReserve(totalDeposit, gasReserveBps);
        require(totalDeposit > platformFee + gasReserve, "FeeCalculator: deposit too low");
        prizePool = totalDeposit - platformFee - gasReserve;
    }
}
