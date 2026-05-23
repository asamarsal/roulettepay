// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IRoulettePay
/// @notice Core interface for RoulettePay contracts
interface IRoulettePay {
    // ─── Enums ──────────────────────────────────────────────────────────────

    enum EventStatus {
        CREATED,
        FUNDED,
        LOCKED,
        VRF_REQUESTED,
        RANDOMNESS_RECEIVED,
        WINNERS_DERIVED,
        REVEALING,
        SETTLING,
        COMPLETED,
        CANCELLED,
        EMERGENCY_CANCELLED
    }

    enum RevealMode {
        ONE_BY_ONE,
        ALL_AT_ONCE
    }

    enum PayoutMode {
        ONE_BY_ONE_TRANSFER,
        BATCH_TRANSFER,
        CLAIMABLE_BALANCE
    }

    enum DistributionMode {
        EQUAL,
        RANKED,
        CUSTOM
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct RouletteEvent {
        uint256 eventId;
        address host;
        bytes32 roomHash;
        bytes32 participantRoot;
        uint256 participantCount;
        uint8 winnerCount;
        uint256 totalDeposit;
        uint256 platformFee;
        uint256 gasReserve;
        uint256 prizePool;
        uint256 vrfRequestId;
        uint256 randomSeed;
        EventStatus status;
        RevealMode revealMode;
        PayoutMode payoutMode;
        DistributionMode distributionMode;
        uint256 createdAt;
        uint256 lockedAt;
        uint256 completedAt;
    }

    struct WinnerInfo {
        uint8 rank;
        uint256 participantIndex;
        address wallet;
        uint256 amount;
        bool revealed;
        bool paid;
        uint256 paidAt;
    }

    struct FeeConfig {
        uint16 platformFeeBps;  // 500 = 5%
        uint16 gasReserveBps;   // 100 = 1%
        uint256 maxPlatformFee; // asset-specific cap
        address treasury;
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    event EventCreated(uint256 indexed eventId, address indexed host, bytes32 roomHash, uint8 winnerCount);
    event EventFunded(uint256 indexed eventId, address indexed host, uint256 totalDeposit, uint256 prizePool, uint256 platformFee, uint256 gasReserve);
    event EventLocked(uint256 indexed eventId, bytes32 participantRoot, uint256 participantCount);
    event SupraVRFRequested(uint256 indexed eventId, uint256 indexed requestId);
    event SupraVRFFulfilled(uint256 indexed eventId, uint256 indexed requestId, uint256 randomSeed);
    event WinnersDerived(uint256 indexed eventId, uint256[] participantIndexes);
    event WinnerRevealed(uint256 indexed eventId, uint8 indexed rank, address indexed wallet, uint256 amount);
    event PrizePaid(uint256 indexed eventId, uint8 indexed rank, address indexed wallet, uint256 amount);
    event BatchPrizePaid(uint256 indexed eventId, uint8 winnerCount, uint256 totalPaid);
    event ClaimablePrizeCredited(uint256 indexed eventId, address indexed wallet, uint256 amount);
    event PrizeClaimed(uint256 indexed eventId, address indexed wallet, uint256 amount);
    event EventCancelled(uint256 indexed eventId, string reason);
    event EmergencyCancelled(uint256 indexed eventId, address indexed admin, string reason);
    event UnusedFundsRefunded(uint256 indexed eventId, address indexed receiver, uint256 amount);
    event TreasuryFeesWithdrawn(address indexed receiver, uint256 amount);

    // ─── View Functions ───────────────────────────────────────────────────────

    function contractName() external pure returns (string memory);
    function contractVersion() external pure returns (string memory);

    function getEvent(uint256 eventId) external view returns (RouletteEvent memory);
    function getWinner(uint256 eventId, uint8 rank) external view returns (WinnerInfo memory);
    function getWinners(uint256 eventId) external view returns (WinnerInfo[] memory);
    function getClaimablePrize(uint256 eventId, address wallet) external view returns (uint256);
    function getVRFRequest(uint256 requestId) external view returns (uint256 eventId, bool fulfilled, uint256 randomSeed);
    function getPrizeEscrow(uint256 eventId) external view returns (uint256 totalDeposit, uint256 platformFee, uint256 gasReserve, uint256 prizePool, uint256 remainingBalance);
    function previewFunding(uint256 amount) external view returns (uint256 platformFee, uint256 gasReserve, uint256 prizePool);
    function estimateGasFeeForWinners(uint8 winnerCount) external view returns (uint256 estimatedGasUnits, uint256 recommendedBufferBps);
}
