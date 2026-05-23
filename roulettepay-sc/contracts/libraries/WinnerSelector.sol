// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title WinnerSelector
/// @notice Library for deriving unique winner indexes from a VRF seed
library WinnerSelector {
    uint8 internal constant MAX_WINNERS = 10;

    /// @notice Derive `winnerCount` unique participant indexes from a VRF seed.
    ///         Uses incremental nonce to avoid resampling collisions.
    ///         Bounded loop: max 10 winners * worst-case retries is acceptable on-chain.
    /// @param seed       The Supra VRF random seed
    /// @param participantCount Total number of locked participants
    /// @param winnerCount Desired number of unique winners (1–10)
    /// @return indexes Array of unique participant indexes, length == winnerCount
    function deriveUniqueWinnerIndexes(
        uint256 seed,
        uint256 participantCount,
        uint8 winnerCount
    ) internal pure returns (uint256[] memory indexes) {
        require(winnerCount >= 1, "WinnerSelector: count too low");
        require(winnerCount <= MAX_WINNERS, "WinnerSelector: count too high");
        require(
            participantCount >= winnerCount,
            "WinnerSelector: not enough participants"
        );

        indexes = new uint256[](winnerCount);
        uint256 selectedCount = 0;
        uint256 nonce = 0;

        // Upper-bound guard: participantCount * MAX_WINNERS iterations max
        uint256 maxIterations = participantCount * MAX_WINNERS + MAX_WINNERS;

        while (selectedCount < winnerCount && nonce < maxIterations) {
            uint256 candidate = uint256(keccak256(abi.encode(seed, nonce))) %
                participantCount;

            bool duplicate = false;
            for (uint256 i = 0; i < selectedCount; i++) {
                if (indexes[i] == candidate) {
                    duplicate = true;
                    break;
                }
            }

            if (!duplicate) {
                indexes[selectedCount] = candidate;
                selectedCount++;
            }

            nonce++;
        }

        require(
            selectedCount == winnerCount,
            "WinnerSelector: failed to derive all winners"
        );
    }

    /// @notice Calculate equal prize amounts per winner, handling remainder
    /// @return amounts Array of equal amounts (last winner absorbs dust remainder)
    function distributeEqual(
        uint256 prizePool,
        uint8 winnerCount
    ) internal pure returns (uint256[] memory amounts) {
        require(winnerCount > 0, "WinnerSelector: zero winners");
        amounts = new uint256[](winnerCount);
        uint256 amountEach = prizePool / winnerCount;
        uint256 remainder = prizePool - (amountEach * winnerCount);

        for (uint8 i = 0; i < winnerCount; i++) {
            amounts[i] = amountEach;
        }
        // Give dust remainder to rank-0 (first/top) winner
        if (remainder > 0) {
            amounts[0] += remainder;
        }
    }

    /// @notice Calculate ranked prize amounts using basis points
    /// @param rankedBps Array of basis points per rank; must sum to 10_000
    function distributeRanked(
        uint256 prizePool,
        uint16[] memory rankedBps,
        uint8 winnerCount
    ) internal pure returns (uint256[] memory amounts) {
        require(
            rankedBps.length == winnerCount,
            "WinnerSelector: bps length mismatch"
        );

        uint256 total = 0;
        for (uint8 i = 0; i < winnerCount; i++) {
            total += rankedBps[i];
        }
        require(total == 10_000, "WinnerSelector: bps must sum to 10000");

        amounts = new uint256[](winnerCount);
        uint256 distributed = 0;
        for (uint8 i = 0; i < winnerCount; i++) {
            if (i == winnerCount - 1) {
                // Last winner gets remainder to avoid dust loss
                amounts[i] = prizePool - distributed;
            } else {
                amounts[i] = (prizePool * rankedBps[i]) / 10_000;
                distributed += amounts[i];
            }
        }
    }

    /// @notice Validate custom distribution amounts sum to prize pool
    function validateCustomDistribution(
        uint256 prizePool,
        uint256[] memory customAmounts,
        uint8 winnerCount
    ) internal pure {
        require(
            customAmounts.length == winnerCount,
            "WinnerSelector: custom amounts length mismatch"
        );
        uint256 sum = 0;
        for (uint8 i = 0; i < winnerCount; i++) {
            sum += customAmounts[i];
        }
        require(
            sum == prizePool,
            "WinnerSelector: custom amounts must sum to prize pool"
        );
    }
}
