// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IRoulettePay.sol";
import "../interfaces/ISupraRouter.sol";
import "../libraries/FeeCalculator.sol";
import "../libraries/WinnerSelector.sol";

/// @title BaseRoulettePay
/// @notice Abstract base contract for RoulettePay ETH/USDC/USDT variants.
///         Implements all business logic except asset-specific transfer functions.
/// @dev Inheriting contracts must implement _transferPrize and _refundAsset.
abstract contract BaseRoulettePay is
    IRoulettePay,
    AccessControl,
    ReentrancyGuard,
    Pausable
{
    // ─── Roles ───────────────────────────────────────────────────────────────

    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");
    bytes32 public constant RELAYER_ROLE  = keccak256("RELAYER_ROLE");
    bytes32 public constant PAUSER_ROLE   = keccak256("PAUSER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // ─── Constants ───────────────────────────────────────────────────────────

    uint8   public constant MAX_WINNERS        = 10;
    uint256 public constant VERSION_MAJOR      = 1;

    // Gas estimate helpers (used by estimateGasFeeForWinners)
    uint256 public basePayoutGasUnits      = 80_000;
    uint256 public gasPerWinnerUnits       = 45_000;
    uint16  public recommendedGasBufferBps = 5_000; // 50%

    // ─── State ───────────────────────────────────────────────────────────────

    ISupraRouter public supraRouter;

    FeeConfig public feeConfig;

    uint256 public nextEventId;

    /// eventId → RouletteEvent
    mapping(uint256 => RouletteEvent) internal _events;

    /// eventId → rank (0-indexed) → WinnerInfo
    mapping(uint256 => mapping(uint8 => WinnerInfo)) internal _winners;

    /// eventId → winnerCount stored (to iterate)
    mapping(uint256 => uint8) internal _winnerCountStored;

    /// eventId → revealIndex (for ONE_BY_ONE reveal)
    mapping(uint256 => uint8) internal _revealIndex;

    /// VRF requestId → eventId
    mapping(uint256 => uint256) internal _vrfRequestToEvent;
    /// VRF requestId → VRFRequest metadata
    struct VRFRequest {
        uint256 eventId;
        bool fulfilled;
        uint256 randomSeed;
    }
    mapping(uint256 => VRFRequest) internal _vrfRequests;

    /// eventId → claimable balance per wallet (CLAIMABLE_BALANCE mode)
    mapping(uint256 => mapping(address => uint256)) internal _claimable;

    /// eventId → refund claimed flag
    mapping(uint256 => bool) internal _refundClaimed;

    /// eventId → ranked bps config (RANKED distribution)
    mapping(uint256 => uint16[]) internal _rankedBps;

    /// eventId → custom amounts config (CUSTOM distribution)
    mapping(uint256 => uint256[]) internal _customAmounts;

    /// eventId → amount paid out so far
    mapping(uint256 => uint256) internal _totalPaidOut;

    /// Treasury-accumulated platform fees (ready to withdraw)
    uint256 internal _treasuryBalance;

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _supraRouter,
        address _treasury,
        uint16 _platformFeeBps,
        uint16 _gasReserveBps,
        uint256 _maxPlatformFee
    ) {
        require(_supraRouter != address(0), "Base: zero supra router");
        require(_treasury    != address(0), "Base: zero treasury");
        require(_platformFeeBps <= 1_000,   "Base: fee bps too high"); // max 10%
        require(_gasReserveBps  <= 500,     "Base: gas reserve bps too high");

        supraRouter = ISupraRouter(_supraRouter);

        feeConfig = FeeConfig({
            platformFeeBps: _platformFeeBps,
            gasReserveBps:  _gasReserveBps,
            maxPlatformFee: _maxPlatformFee,
            treasury:       _treasury
        });

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE,         msg.sender);
        _grantRole(PAUSER_ROLE,        msg.sender);
        _grantRole(TREASURY_ROLE,      msg.sender);
    }

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyHostOrAdmin(uint256 eventId) {
        require(
            _events[eventId].host == msg.sender ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Base: not host or admin"
        );
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Base: not admin");
        _;
    }

    modifier onlyRelayer() {
        require(hasRole(RELAYER_ROLE, msg.sender), "Base: not relayer");
        _;
    }

    modifier onlySupraRouter() {
        require(msg.sender == address(supraRouter), "Base: caller not Supra router");
        _;
    }

    modifier eventExists(uint256 eventId) {
        require(_events[eventId].host != address(0), "Base: event not found");
        _;
    }

    // ─── Event Creation ───────────────────────────────────────────────────────

    /// @notice Create a new roulette event. Returns the assigned eventId.
    function createEvent(
        bytes32 roomHash,
        uint8 winnerCount,
        RevealMode revealMode,
        PayoutMode payoutMode,
        DistributionMode distributionMode
    ) external whenNotPaused returns (uint256 eventId) {
        require(roomHash != bytes32(0),      "Base: zero room hash");
        require(winnerCount >= 1,            "Winner count too low");
        require(winnerCount <= MAX_WINNERS,  "Winner count too high");

        eventId = nextEventId;
        unchecked { nextEventId++; }

        _events[eventId] = RouletteEvent({
            eventId:          eventId,
            host:             msg.sender,
            roomHash:         roomHash,
            participantRoot:  bytes32(0),
            participantCount: 0,
            winnerCount:      winnerCount,
            totalDeposit:     0,
            platformFee:      0,
            gasReserve:       0,
            prizePool:        0,
            vrfRequestId:     0,
            randomSeed:       0,
            status:           EventStatus.CREATED,
            revealMode:       revealMode,
            payoutMode:       payoutMode,
            distributionMode: distributionMode,
            createdAt:        block.timestamp,
            lockedAt:         0,
            completedAt:      0
        });

        emit EventCreated(eventId, msg.sender, roomHash, winnerCount);
    }

    /// @notice Set ranked distribution basis points. Must be called before funding.
    function setRankedDistribution(uint256 eventId, uint16[] calldata bps)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
    {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.CREATED, "Base: already funded or locked");
        require(ev.distributionMode == DistributionMode.RANKED, "Base: not RANKED mode");
        require(bps.length == ev.winnerCount, "Base: bps length mismatch");

        uint256 sum = 0;
        for (uint8 i = 0; i < bps.length; i++) sum += bps[i];
        require(sum == 10_000, "Base: bps must sum to 10000");

        _rankedBps[eventId] = bps;
    }

    /// @notice Set custom distribution amounts. Must be called before funding.
    function setCustomDistribution(uint256 eventId, uint256[] calldata amounts)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
    {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.CREATED, "Base: already funded or locked");
        require(ev.distributionMode == DistributionMode.CUSTOM, "Base: not CUSTOM mode");
        require(amounts.length == ev.winnerCount, "Base: amounts length mismatch");
        // Note: sum validated against prizePool during deriveWinners

        _customAmounts[eventId] = amounts;
    }

    // ─── Funding (asset-specific hook) ───────────────────────────────────────

    /// @dev Called by child contracts after receiving assets. Applies fee math.
    function _applyFunding(uint256 eventId, uint256 totalDeposit) internal {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.CREATED, "Base: already funded");
        require(totalDeposit > 0, "Base: zero deposit");

        (uint256 pFee, uint256 gReserve, uint256 prize) = FeeCalculator.calculateNetPrizePool(
            totalDeposit,
            feeConfig.platformFeeBps,
            feeConfig.gasReserveBps,
            feeConfig.maxPlatformFee
        );

        ev.totalDeposit = totalDeposit;
        ev.platformFee  = pFee;
        ev.gasReserve   = gReserve;
        ev.prizePool    = prize;
        ev.status       = EventStatus.FUNDED;

        _treasuryBalance += pFee;

        emit EventFunded(eventId, ev.host, totalDeposit, prize, pFee, gReserve);
    }

    // ─── Room Locking ─────────────────────────────────────────────────────────

    /// @notice Lock participant list. After lock, no event parameters can change.
    function lockEvent(
        uint256 eventId,
        bytes32 participantRoot,
        uint256 participantCount
    ) external onlyHostOrAdmin(eventId) eventExists(eventId) whenNotPaused {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.FUNDED,         "Base: not FUNDED");
        require(participantRoot != bytes32(0),            "Base: zero participant root");
        require(participantCount >= ev.winnerCount,       "Base: not enough participants");
        require(participantCount <= type(uint128).max,    "Base: participant count overflow");

        ev.participantRoot  = participantRoot;
        ev.participantCount = participantCount;
        ev.lockedAt         = block.timestamp;
        ev.status           = EventStatus.LOCKED;

        emit EventLocked(eventId, participantRoot, participantCount);
    }

    // ─── Supra VRF ────────────────────────────────────────────────────────────

    /// @notice Request Supra VRF randomness for a locked event.
    function requestSupraRandomness(uint256 eventId)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
        whenNotPaused
    {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.LOCKED,          "Base: not LOCKED");
        require(ev.participantRoot != bytes32(0),          "Base: no participant root");
        require(ev.participantCount >= ev.winnerCount,     "Base: not enough participants");

        ev.status = EventStatus.VRF_REQUESTED;

        // Request 1 random number from Supra VRF (1 word is sufficient; we derive all winners from one seed)
        uint256 requestId = supraRouter.generateRequest(
            "supraCallback(uint256,uint256[])",
            1,   // rng count
            1,   // confirmations
            0,   // client seed (0 = pure VRF)
            address(this)
        );

        ev.vrfRequestId = requestId;
        _vrfRequestToEvent[requestId] = eventId;
        _vrfRequests[requestId] = VRFRequest({ eventId: eventId, fulfilled: false, randomSeed: 0 });

        emit SupraVRFRequested(eventId, requestId);
    }

    /// @notice Supra VRF callback. Only Supra router may call.
    /// @dev Stores randomness only. No heavy transfer logic here.
    function supraCallback(uint256 requestId, uint256[] calldata randomWords)
        external
        onlySupraRouter
    {
        require(randomWords.length > 0, "Base: empty random words");

        VRFRequest storage req = _vrfRequests[requestId];
        require(req.eventId != 0 || _events[0].host != address(0), "Base: unknown request");
        require(!req.fulfilled, "Base: already fulfilled");

        uint256 eventId = req.eventId;
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.VRF_REQUESTED, "Base: not VRF_REQUESTED");

        uint256 seed = randomWords[0];
        require(seed != 0, "Base: zero random seed");

        req.fulfilled    = true;
        req.randomSeed   = seed;
        ev.randomSeed    = seed;
        ev.status        = EventStatus.RANDOMNESS_RECEIVED;

        emit SupraVRFFulfilled(eventId, requestId, seed);
    }

    // ─── Winner Derivation ────────────────────────────────────────────────────

    /// @notice Derive winners from VRF seed. Backend submits winner wallet addresses
    ///         corresponding to the derived participant indexes.
    function deriveWinners(
        uint256 eventId,
        address[] calldata winnerWallets
    )
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
        whenNotPaused
    {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.RANDOMNESS_RECEIVED, "Base: no randomness");
        require(winnerWallets.length == ev.winnerCount,        "Base: wallet count mismatch");

        // Verify no zero or duplicate wallet addresses
        for (uint8 i = 0; i < ev.winnerCount; i++) {
            require(winnerWallets[i] != address(0), "Base: zero winner wallet");
            for (uint8 j = i + 1; j < ev.winnerCount; j++) {
                require(winnerWallets[i] != winnerWallets[j], "Base: duplicate wallet");
            }
        }

        // Derive unique participant indexes from VRF seed
        uint256[] memory indexes = WinnerSelector.deriveUniqueWinnerIndexes(
            ev.randomSeed,
            ev.participantCount,
            ev.winnerCount
        );

        // Calculate prize amounts per distribution mode
        uint256[] memory amounts = _calculatePrizeAmounts(eventId, ev.prizePool, ev.winnerCount);

        // Validate CUSTOM distribution sum against prizePool
        if (ev.distributionMode == DistributionMode.CUSTOM) {
            uint256 sum = 0;
            for (uint8 i = 0; i < ev.winnerCount; i++) sum += amounts[i];
            require(sum == ev.prizePool, "Base: custom sum != prizePool");
        }

        // Store winner info
        for (uint8 rank = 0; rank < ev.winnerCount; rank++) {
            _winners[eventId][rank] = WinnerInfo({
                rank:             rank,
                participantIndex: indexes[rank],
                wallet:           winnerWallets[rank],
                amount:           amounts[rank],
                revealed:         false,
                paid:             false,
                paidAt:           0
            });
        }

        _winnerCountStored[eventId] = ev.winnerCount;
        ev.status = EventStatus.WINNERS_DERIVED;

        emit WinnersDerived(eventId, indexes);
    }

    function _calculatePrizeAmounts(
        uint256 eventId,
        uint256 prizePool,
        uint8 winnerCount
    ) internal view returns (uint256[] memory amounts) {
        DistributionMode mode = _events[eventId].distributionMode;

        if (mode == DistributionMode.EQUAL) {
            amounts = WinnerSelector.distributeEqual(prizePool, winnerCount);
        } else if (mode == DistributionMode.RANKED) {
            amounts = WinnerSelector.distributeRanked(prizePool, _rankedBps[eventId], winnerCount);
        } else {
            // CUSTOM: amounts already set by host
            uint256[] storage stored = _customAmounts[eventId];
            require(stored.length == winnerCount, "Base: custom not configured");
            amounts = new uint256[](winnerCount);
            for (uint8 i = 0; i < winnerCount; i++) amounts[i] = stored[i];
        }
    }

    // ─── Reveal ───────────────────────────────────────────────────────────────

    /// @notice Reveal next winner one by one.
    function revealNextWinner(uint256 eventId)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
    {
        RouletteEvent storage ev = _events[eventId];
        require(
            ev.status == EventStatus.WINNERS_DERIVED || ev.status == EventStatus.REVEALING,
            "Base: winners not derived"
        );
        require(ev.revealMode == RevealMode.ONE_BY_ONE, "Base: not ONE_BY_ONE mode");

        uint8 idx = _revealIndex[eventId];
        require(idx < ev.winnerCount, "Base: all winners revealed");

        WinnerInfo storage w = _winners[eventId][idx];
        w.revealed = true;

        if (ev.status == EventStatus.WINNERS_DERIVED) {
            ev.status = EventStatus.REVEALING;
        }

        _revealIndex[eventId]++;

        emit WinnerRevealed(eventId, idx, w.wallet, w.amount);
    }

    /// @notice Reveal all winners at once.
    function revealAllWinners(uint256 eventId)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
    {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status == EventStatus.WINNERS_DERIVED, "Base: winners not derived");
        require(ev.revealMode == RevealMode.ALL_AT_ONCE,  "Base: not ALL_AT_ONCE mode");

        ev.status = EventStatus.REVEALING;

        for (uint8 i = 0; i < ev.winnerCount; i++) {
            WinnerInfo storage w = _winners[eventId][i];
            w.revealed = true;
            emit WinnerRevealed(eventId, i, w.wallet, w.amount);
        }
        _revealIndex[eventId] = ev.winnerCount;
    }

    // ─── Payout (asset-specific transfer hooks) ───────────────────────────────

    /// @notice Transfer prize to a single revealed winner (ONE_BY_ONE_TRANSFER mode).
    function transferWinner(uint256 eventId, uint8 rank)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
        nonReentrant
        whenNotPaused
    {
        RouletteEvent storage ev = _events[eventId];
        require(
            ev.payoutMode == PayoutMode.ONE_BY_ONE_TRANSFER,
            "Base: not ONE_BY_ONE_TRANSFER"
        );
        require(
            ev.status == EventStatus.REVEALING || ev.status == EventStatus.SETTLING,
            "Base: wrong status for payout"
        );

        WinnerInfo storage w = _winners[eventId][rank];
        require(w.wallet != address(0), "Base: winner not set");
        require(w.revealed,             "Base: winner not revealed");
        require(!w.paid,                "Base: already paid");
        require(w.amount > 0,           "Base: zero amount");

        // CEI: mark paid BEFORE external call
        w.paid   = true;
        w.paidAt = block.timestamp;
        _totalPaidOut[eventId] += w.amount;

        if (ev.status == EventStatus.REVEALING) {
            ev.status = EventStatus.SETTLING;
        }

        _transferPrize(w.wallet, w.amount);

        emit PrizePaid(eventId, rank, w.wallet, w.amount);

        // Check if all winners paid → mark completed
        _checkAndComplete(eventId);
    }

    /// @notice Batch transfer prizes to all winners.
    function batchTransferWinners(uint256 eventId)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
        nonReentrant
        whenNotPaused
    {
        RouletteEvent storage ev = _events[eventId];
        require(
            ev.payoutMode == PayoutMode.BATCH_TRANSFER,
            "Base: not BATCH_TRANSFER"
        );
        require(
            ev.status == EventStatus.WINNERS_DERIVED ||
            ev.status == EventStatus.REVEALING ||
            ev.status == EventStatus.SETTLING,
            "Base: wrong status"
        );

        ev.status = EventStatus.SETTLING;

        uint256 totalPaid = 0;
        uint8 cnt = _winnerCountStored[eventId];

        for (uint8 i = 0; i < cnt; i++) {
            WinnerInfo storage w = _winners[eventId][i];
            if (w.paid || w.amount == 0) continue;

            // CEI per winner
            w.paid   = true;
            w.paidAt = block.timestamp;
            totalPaid += w.amount;

            _transferPrize(w.wallet, w.amount);

            emit PrizePaid(eventId, i, w.wallet, w.amount);
        }

        _totalPaidOut[eventId] += totalPaid;
        ev.status = EventStatus.COMPLETED;
        ev.completedAt = block.timestamp;

        emit BatchPrizePaid(eventId, cnt, totalPaid);
    }

    /// @notice Credit claimable balances for all winners (CLAIMABLE_BALANCE mode).
    function creditClaimablePrizes(uint256 eventId)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
        nonReentrant
        whenNotPaused
    {
        RouletteEvent storage ev = _events[eventId];
        require(ev.payoutMode == PayoutMode.CLAIMABLE_BALANCE, "Base: not CLAIMABLE");
        require(
            ev.status == EventStatus.WINNERS_DERIVED || ev.status == EventStatus.REVEALING,
            "Base: wrong status"
        );

        ev.status = EventStatus.SETTLING;
        uint8 cnt = _winnerCountStored[eventId];

        for (uint8 i = 0; i < cnt; i++) {
            WinnerInfo storage w = _winners[eventId][i];
            if (w.paid || w.amount == 0) continue;

            w.paid   = true;
            w.paidAt = block.timestamp;
            _claimable[eventId][w.wallet] += w.amount;
            _totalPaidOut[eventId] += w.amount;

            emit ClaimablePrizeCredited(eventId, w.wallet, w.amount);
        }
    }

    /// @notice Winner claims their own prize (CLAIMABLE_BALANCE mode).
    function claimPrize(uint256 eventId)
        external
        nonReentrant
        whenNotPaused
        eventExists(eventId)
    {
        _executeClaim(eventId, msg.sender);
    }

    /// @notice Relayer claims on behalf of a generated wallet.
    function claimFor(uint256 eventId, address winner)
        external
        onlyRelayer
        nonReentrant
        whenNotPaused
        eventExists(eventId)
    {
        _executeClaim(eventId, winner);
    }

    function _executeClaim(uint256 eventId, address winner) internal {
        require(_events[eventId].status == EventStatus.SETTLING, "Base: not SETTLING");
        uint256 amount = _claimable[eventId][winner];
        require(amount > 0, "Base: nothing to claim");

        // CEI: clear before transfer
        _claimable[eventId][winner] = 0;

        _transferPrize(winner, amount);

        emit PrizeClaimed(eventId, winner, amount);
        _checkAndComplete(eventId);
    }

    function _checkAndComplete(uint256 eventId) internal {
        RouletteEvent storage ev = _events[eventId];
        if (ev.status == EventStatus.COMPLETED) return;

        uint8 cnt = _winnerCountStored[eventId];
        for (uint8 i = 0; i < cnt; i++) {
            if (!_winners[eventId][i].paid) return;
        }

        ev.status = EventStatus.COMPLETED;
        ev.completedAt = block.timestamp;
    }

    // ─── Cancel & Refund ─────────────────────────────────────────────────────

    /// @notice Host can cancel before VRF is requested.
    function cancelEvent(uint256 eventId)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
        nonReentrant
    {
        RouletteEvent storage ev = _events[eventId];
        require(
            ev.status == EventStatus.CREATED ||
            ev.status == EventStatus.FUNDED  ||
            ev.status == EventStatus.LOCKED,
            "Base: cannot cancel after VRF"
        );

        ev.status = EventStatus.CANCELLED;

        emit EventCancelled(eventId, "Host cancelled");
    }

    /// @notice Admin emergency cancel at any stage before COMPLETED.
    function emergencyCancel(uint256 eventId, string calldata reason)
        external
        onlyAdmin
        eventExists(eventId)
        nonReentrant
    {
        RouletteEvent storage ev = _events[eventId];
        require(ev.status != EventStatus.COMPLETED,           "Base: already completed");
        require(ev.status != EventStatus.EMERGENCY_CANCELLED, "Base: already cancelled");

        ev.status = EventStatus.EMERGENCY_CANCELLED;

        emit EmergencyCancelled(eventId, msg.sender, reason);
    }

    /// @notice Refund unused funds (gas reserve remainder + any undistributed pool)
    ///         after event is COMPLETED, CANCELLED, or EMERGENCY_CANCELLED.
    function refundUnusedFunds(uint256 eventId)
        external
        onlyHostOrAdmin(eventId)
        eventExists(eventId)
        nonReentrant
    {
        RouletteEvent storage ev = _events[eventId];
        require(
            ev.status == EventStatus.COMPLETED          ||
            ev.status == EventStatus.CANCELLED          ||
            ev.status == EventStatus.EMERGENCY_CANCELLED,
            "Base: not refundable"
        );
        require(!_refundClaimed[eventId], "Base: refund already claimed");

        _refundClaimed[eventId] = true;

        uint256 refundAmount = _computeRefundAmount(eventId);

        if (refundAmount == 0) return;

        address receiver = ev.host;

        _refundAsset(receiver, refundAmount);

        emit UnusedFundsRefunded(eventId, receiver, refundAmount);
    }

    function _computeRefundAmount(uint256 eventId) internal view returns (uint256) {
        RouletteEvent storage ev = _events[eventId];
        EventStatus status = ev.status;

        if (status == EventStatus.CANCELLED || status == EventStatus.EMERGENCY_CANCELLED) {
            // Return prize pool + gas reserve (platform fee is non-refundable)
            return ev.prizePool + ev.gasReserve;
        }

        if (status == EventStatus.COMPLETED) {
            // Return unused gas reserve only (prize was paid out)
            uint256 paidOut = _totalPaidOut[eventId];
            uint256 remaining = ev.prizePool > paidOut ? ev.prizePool - paidOut : 0;
            return ev.gasReserve + remaining;
        }

        return 0;
    }

    // ─── Treasury ─────────────────────────────────────────────────────────────

    /// @notice Withdraw accumulated platform fees to treasury.
    function withdrawTreasuryFees(address to, uint256 amount)
        external
        onlyAdmin
        nonReentrant
    {
        require(to != address(0),           "Base: zero to address");
        require(amount > 0,                 "Base: zero amount");
        require(amount <= _treasuryBalance, "Base: insufficient treasury");

        _treasuryBalance -= amount;

        _transferPrize(to, amount);

        emit TreasuryFeesWithdrawn(to, amount);
    }

    // ─── Admin Setters ────────────────────────────────────────────────────────

    function setSupraRouter(address router) external onlyAdmin {
        require(router != address(0), "Base: zero router");
        supraRouter = ISupraRouter(router);
    }

    function setTreasury(address treasury) external onlyRole(TREASURY_ROLE) {
        require(treasury != address(0), "Base: zero treasury");
        feeConfig.treasury = treasury;
    }

    function setFeeConfig(
        uint16 platformFeeBps,
        uint16 gasReserveBps,
        uint256 maxPlatformFee
    ) external onlyAdmin {
        require(platformFeeBps <= 1_000, "Base: fee bps too high");
        require(gasReserveBps  <= 500,   "Base: gas bps too high");
        feeConfig.platformFeeBps = platformFeeBps;
        feeConfig.gasReserveBps  = gasReserveBps;
        feeConfig.maxPlatformFee = maxPlatformFee;
    }

    function setGasEstimateParams(
        uint256 _baseGasUnits,
        uint256 _gasPerWinner,
        uint16  _bufferBps
    ) external onlyAdmin {
        basePayoutGasUnits      = _baseGasUnits;
        gasPerWinnerUnits       = _gasPerWinner;
        recommendedGasBufferBps = _bufferBps;
    }

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ─── View Functions ───────────────────────────────────────────────────────

    function contractVersion() external pure override returns (string memory) {
        return "1.0.0";
    }

    function getEvent(uint256 eventId) external view override returns (RouletteEvent memory) {
        return _events[eventId];
    }

    function getWinner(uint256 eventId, uint8 rank)
        external view override returns (WinnerInfo memory)
    {
        return _winners[eventId][rank];
    }

    function getWinners(uint256 eventId)
        external view override returns (WinnerInfo[] memory list)
    {
        uint8 cnt = _winnerCountStored[eventId];
        list = new WinnerInfo[](cnt);
        for (uint8 i = 0; i < cnt; i++) {
            list[i] = _winners[eventId][i];
        }
    }

    function getClaimablePrize(uint256 eventId, address wallet)
        external view override returns (uint256)
    {
        return _claimable[eventId][wallet];
    }

    function getVRFRequest(uint256 requestId)
        external view override
        returns (uint256 eventId, bool fulfilled, uint256 randomSeed)
    {
        VRFRequest storage req = _vrfRequests[requestId];
        return (req.eventId, req.fulfilled, req.randomSeed);
    }

    function getPrizeEscrow(uint256 eventId)
        external view override
        returns (
            uint256 totalDeposit,
            uint256 platformFee,
            uint256 gasReserve,
            uint256 prizePool,
            uint256 remainingBalance
        )
    {
        RouletteEvent storage ev = _events[eventId];
        totalDeposit     = ev.totalDeposit;
        platformFee      = ev.platformFee;
        gasReserve       = ev.gasReserve;
        prizePool        = ev.prizePool;
        uint256 paidOut  = _totalPaidOut[eventId];
        remainingBalance = prizePool > paidOut ? prizePool - paidOut : 0;
    }

    function previewFunding(uint256 amount)
        external view override
        returns (uint256 platformFee, uint256 gasReserve, uint256 prizePool)
    {
        (platformFee, gasReserve, prizePool) = FeeCalculator.calculateNetPrizePool(
            amount,
            feeConfig.platformFeeBps,
            feeConfig.gasReserveBps,
            feeConfig.maxPlatformFee
        );
    }

    function estimateGasFeeForWinners(uint8 winnerCount)
        external view override
        returns (uint256 estimatedGasUnits, uint256 recommendedBufferBps)
    {
        require(winnerCount >= 1,           "Winner count too low");
        require(winnerCount <= MAX_WINNERS, "Winner count too high");
        estimatedGasUnits    = basePayoutGasUnits + (gasPerWinnerUnits * winnerCount);
        recommendedBufferBps = recommendedGasBufferBps;
    }

    function calculatePlatformFee(uint256 amount) public view returns (uint256) {
        return FeeCalculator.calculatePlatformFee(
            amount, feeConfig.platformFeeBps, feeConfig.maxPlatformFee
        );
    }

    function calculateGasReserve(uint256 amount) public view returns (uint256) {
        return FeeCalculator.calculateGasReserve(amount, feeConfig.gasReserveBps);
    }

    function treasuryBalance() external view returns (uint256) {
        return _treasuryBalance;
    }

    // ─── Abstract Hooks ───────────────────────────────────────────────────────

    /// @dev Child contract implements asset-specific transfer to recipient
    function _transferPrize(address to, uint256 amount) internal virtual;

    /// @dev Child contract implements asset-specific refund to host
    function _refundAsset(address to, uint256 amount) internal virtual;
}
