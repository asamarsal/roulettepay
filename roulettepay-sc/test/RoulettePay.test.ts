import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, parseEther, parseUnits, ZeroHash } from "ethers";
import {
  RoulettePayETH,
  RoulettePayUSDC,
  MockSupraRouter,
  MockERC20,
} from "../typechain-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROOM_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-room-001"));
const PARTICIPANT_ROOT = ethers.keccak256(ethers.toUtf8Bytes("participants-001"));
const PARTICIPANT_COUNT = 50n;

enum EventStatus {
  CREATED, FUNDED, LOCKED, VRF_REQUESTED,
  RANDOMNESS_RECEIVED, WINNERS_DERIVED, REVEALING,
  SETTLING, COMPLETED, CANCELLED, EMERGENCY_CANCELLED,
}
enum RevealMode   { ONE_BY_ONE, ALL_AT_ONCE }
enum PayoutMode   { ONE_BY_ONE_TRANSFER, BATCH_TRANSFER, CLAIMABLE_BALANCE }
enum DistribMode  { EQUAL, RANKED, CUSTOM }

async function createAndFundETH(
  contract: RoulettePayETH,
  host: Signer,
  winnerCount: number,
  revealMode: RevealMode,
  payoutMode: PayoutMode,
  depositEth: bigint
): Promise<bigint> {
  const tx = await contract.connect(host).createEvent(
    ROOM_HASH, winnerCount, revealMode, payoutMode, DistribMode.EQUAL
  );
  const receipt = await tx.wait();
  const eventId = (receipt!.logs[0] as any).args[0] as bigint;

  await contract.connect(host).fundEvent(eventId, { value: depositEth });
  return eventId;
}

// ─── ETH Tests ───────────────────────────────────────────────────────────────

describe("RoulettePayETH", () => {
  let supra: MockSupraRouter;
  let roulette: RoulettePayETH;
  let admin: Signer, host: Signer, winner1: Signer, winner2: Signer, relayer: Signer;
  let winners: Signer[];

  const DEPOSIT = parseEther("1");

  beforeEach(async () => {
    [admin, host, winner1, winner2, relayer, ...winners] = await ethers.getSigners();

    supra    = await ethers.deployContract("MockSupraRouter");
    roulette = await ethers.deployContract("RoulettePayETH", [
      await supra.getAddress(),
      await admin.getAddress(),
      parseEther("0.0003"),
    ]);

    // Grant relayer role
    await roulette.connect(admin).grantRole(
      await roulette.RELAYER_ROLE(),
      await relayer.getAddress()
    );
  });

  // ── Event Creation ──────────────────────────────────────────────────────────

  it("creates an ETH event", async () => {
    const tx = await roulette.connect(host).createEvent(
      ROOM_HASH, 3, RevealMode.ALL_AT_ONCE, PayoutMode.BATCH_TRANSFER, DistribMode.EQUAL
    );
    const receipt = await tx.wait();
    const ev = await roulette.getFunction("getEvent")(0n);

    expect(ev.host).to.equal(await host.getAddress());
    expect(ev.winnerCount).to.equal(3);
    expect(ev.status).to.equal(EventStatus.CREATED);
  });

  it("rejects winner count = 0", async () => {
    await expect(
      roulette.connect(host).createEvent(ROOM_HASH, 0, 0, 0, 0)
    ).to.be.revertedWith("Winner count too low");
  });

  it("rejects winner count > 10", async () => {
    await expect(
      roulette.connect(host).createEvent(ROOM_HASH, 11, 0, 0, 0)
    ).to.be.revertedWith("Winner count too high");
  });

  // ── Funding ─────────────────────────────────────────────────────────────────

  it("funds event and calculates 5% fee (capped)", async () => {
    const eventId = await createAndFundETH(
      roulette, host, 1, RevealMode.ALL_AT_ONCE, PayoutMode.BATCH_TRANSFER, DEPOSIT
    );

    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.FUNDED);
    expect(ev.totalDeposit).to.equal(DEPOSIT);

    // 5% of 1 ETH = 0.05 ETH, but capped at 0.0003 ETH
    expect(ev.platformFee).to.equal(parseEther("0.0003"));
    // 1% gasReserve
    expect(ev.gasReserve).to.equal(DEPOSIT / 100n);
    expect(ev.prizePool).to.equal(DEPOSIT - ev.platformFee - ev.gasReserve);
  });

  it("fee calculation: small deposit (fee not capped)", async () => {
    const smallDeposit = parseEther("0.001");
    const feePreview = await roulette.previewFunding(smallDeposit);
    // 5% of 0.001 ETH = 0.00005 ETH < cap 0.0003
    expect(feePreview.platformFee).to.equal(smallDeposit * 500n / 10000n);
  });

  it("rejects direct ETH deposit via receive()", async () => {
    await expect(
      admin.sendTransaction({ to: await roulette.getAddress(), value: parseEther("1") })
    ).to.be.revertedWith("Use fundEvent()");
  });

  it("rejects non-host funding", async () => {
    const tx = await roulette.connect(host).createEvent(ROOM_HASH, 1, 0, 1, 0);
    const receipt = await tx.wait();
    const eventId = (receipt!.logs[0] as any).args[0] as bigint;

    await expect(
      roulette.connect(winner1).fundEvent(eventId, { value: DEPOSIT })
    ).to.be.revertedWith("ETH: only host can fund");
  });

  // ── Locking ─────────────────────────────────────────────────────────────────

  it("locks event and prevents re-lock", async () => {
    const eventId = await createAndFundETH(roulette, host, 3, 0, 1, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);

    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.LOCKED);
    expect(ev.participantRoot).to.equal(PARTICIPANT_ROOT);

    await expect(
      roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT)
    ).to.be.revertedWith("Base: not FUNDED");
  });

  it("rejects lock if participant count < winner count", async () => {
    const eventId = await createAndFundETH(roulette, host, 5, 0, 1, DEPOSIT);
    await expect(
      roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, 3n)
    ).to.be.revertedWith("Base: not enough participants");
  });

  // ── VRF ─────────────────────────────────────────────────────────────────────

  it("requests Supra VRF and handles callback", async () => {
    const eventId = await createAndFundETH(roulette, host, 2, 0, 1, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);

    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.VRF_REQUESTED);

    // Fulfill mock VRF
    await supra.fulfillRandomness(ev.vrfRequestId, ethers.randomBytes(32).reduce((a, b) => a * 256n + BigInt(b), 0n));

    const evAfter = await roulette.getFunction("getEvent")(eventId);
    expect(evAfter.status).to.equal(EventStatus.RANDOMNESS_RECEIVED);
    expect(evAfter.randomSeed).to.not.equal(0n);
  });

  it("rejects VRF callback from non-Supra address", async () => {
    const eventId = await createAndFundETH(roulette, host, 1, 0, 1, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);

    await expect(
      roulette.connect(admin).supraCallback(0n, [123n])
    ).to.be.revertedWith("Base: caller not Supra router");
  });

  // ── Winner Derivation ────────────────────────────────────────────────────────

  async function setupThroughVRF(winnerCount: number): Promise<{ eventId: bigint; winnerWallets: string[] }> {
    const signers = await ethers.getSigners();
    const eventId = await createAndFundETH(roulette, host, winnerCount, RevealMode.ALL_AT_ONCE, PayoutMode.BATCH_TRANSFER, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);

    const ev = await roulette.getFunction("getEvent")(eventId);
    const seed = BigInt("0x" + Buffer.from(ethers.randomBytes(32)).toString("hex"));
    await supra.fulfillRandomness(ev.vrfRequestId, seed);

    const winnerWallets = signers.slice(5, 5 + winnerCount).map(s => s.address);
    await roulette.connect(host).deriveWinners(eventId, winnerWallets);
    return { eventId, winnerWallets };
  }

  it("derives 1 winner", async () => {
    const { eventId } = await setupThroughVRF(1);
    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.WINNERS_DERIVED);
  });

  it("derives 10 winners", async () => {
    const { eventId } = await setupThroughVRF(10);
    const ws = await roulette.getWinners(eventId);
    expect(ws.length).to.equal(10);
  });

  it("prevents duplicate wallets in deriveWinners", async () => {
    const eventId = await createAndFundETH(roulette, host, 2, 0, 1, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);
    const ev = await roulette.getFunction("getEvent")(eventId);
    const seed = 999999n;
    await supra.fulfillRandomness(ev.vrfRequestId, seed);

    const addr = await winner1.getAddress();
    await expect(
      roulette.connect(host).deriveWinners(eventId, [addr, addr])
    ).to.be.revertedWith("Base: duplicate wallet");
  });

  // ── Reveal ──────────────────────────────────────────────────────────────────

  it("reveals all at once", async () => {
    const { eventId } = await setupThroughVRF(3);
    await roulette.connect(host).revealAllWinners(eventId);

    const ws = await roulette.getWinners(eventId);
    for (const w of ws) expect(w.revealed).to.be.true;
  });

  it("reveals one by one", async () => {
    const signers = await ethers.getSigners();
    const eventId = await createAndFundETH(roulette, host, 3, RevealMode.ONE_BY_ONE, PayoutMode.BATCH_TRANSFER, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);
    const ev = await roulette.getFunction("getEvent")(eventId);
    await supra.fulfillRandomness(ev.vrfRequestId, 12345n);
    const wallets = signers.slice(5, 8).map(s => s.address);
    await roulette.connect(host).deriveWinners(eventId, wallets);

    await roulette.connect(host).revealNextWinner(eventId);
    let w0 = await roulette.getWinner(eventId, 0);
    expect(w0.revealed).to.be.true;
    let w1 = await roulette.getWinner(eventId, 1);
    expect(w1.revealed).to.be.false;
  });

  // ── Payout ──────────────────────────────────────────────────────────────────

  it("batch transfers ETH to all winners", async () => {
    const { eventId, winnerWallets } = await setupThroughVRF(3);
    await roulette.connect(host).revealAllWinners(eventId);

    const balancesBefore = await Promise.all(
      winnerWallets.map(w => ethers.provider.getBalance(w))
    );

    await roulette.connect(host).batchTransferWinners(eventId);

    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.COMPLETED);

    for (let i = 0; i < winnerWallets.length; i++) {
      const balAfter = await ethers.provider.getBalance(winnerWallets[i]);
      expect(balAfter).to.be.gt(balancesBefore[i]);
    }
  });

  it("prevents double payout", async () => {
    const { eventId } = await setupThroughVRF(1);
    await roulette.connect(host).revealAllWinners(eventId);

    // ONE_BY_ONE mode — switch to that mode test separately
    // For batch: first batch completes, second reverts
    await roulette.connect(host).batchTransferWinners(eventId);

    await expect(
      roulette.connect(host).batchTransferWinners(eventId)
    ).to.be.revertedWith("Base: wrong status");
  });

  it("transfers one-by-one", async () => {
    const signers = await ethers.getSigners();
    const eventId = await createAndFundETH(roulette, host, 2, RevealMode.ONE_BY_ONE, PayoutMode.ONE_BY_ONE_TRANSFER, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);
    const ev = await roulette.getFunction("getEvent")(eventId);
    await supra.fulfillRandomness(ev.vrfRequestId, 777n);
    const wallets = signers.slice(5, 7).map(s => s.address);
    await roulette.connect(host).deriveWinners(eventId, wallets);
    await roulette.connect(host).revealNextWinner(eventId);

    const balBefore = await ethers.provider.getBalance(wallets[0]);
    await roulette.connect(host).transferWinner(eventId, 0);
    const balAfter = await ethers.provider.getBalance(wallets[0]);
    expect(balAfter).to.be.gt(balBefore);
  });

  // ── Claimable Balance ────────────────────────────────────────────────────────

  it("credits claimable and allows claim", async () => {
    const signers = await ethers.getSigners();
    const eventId = await createAndFundETH(roulette, host, 1, RevealMode.ALL_AT_ONCE, PayoutMode.CLAIMABLE_BALANCE, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);
    const ev = await roulette.getFunction("getEvent")(eventId);
    await supra.fulfillRandomness(ev.vrfRequestId, 55555n);
    const winnerAddr = signers[5].address;
    await roulette.connect(host).deriveWinners(eventId, [winnerAddr]);
    await roulette.connect(host).creditClaimablePrizes(eventId);

    const claimable = await roulette.getClaimablePrize(eventId, winnerAddr);
    expect(claimable).to.be.gt(0n);

    const balBefore = await ethers.provider.getBalance(winnerAddr);
    await roulette.connect(signers[5]).claimPrize(eventId);
    const balAfter = await ethers.provider.getBalance(winnerAddr);
    expect(balAfter).to.be.gt(balBefore);
  });

  it("relayer can claimFor generated wallet", async () => {
    const signers = await ethers.getSigners();
    const eventId = await createAndFundETH(roulette, host, 1, RevealMode.ALL_AT_ONCE, PayoutMode.CLAIMABLE_BALANCE, DEPOSIT);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);
    const ev = await roulette.getFunction("getEvent")(eventId);
    await supra.fulfillRandomness(ev.vrfRequestId, 77777n);
    const winnerAddr = signers[5].address;
    await roulette.connect(host).deriveWinners(eventId, [winnerAddr]);
    await roulette.connect(host).creditClaimablePrizes(eventId);

    await roulette.connect(relayer).claimFor(eventId, winnerAddr);
    const claimable = await roulette.getClaimablePrize(eventId, winnerAddr);
    expect(claimable).to.equal(0n);
  });

  // ── Cancel & Refund ──────────────────────────────────────────────────────────

  it("host can cancel before VRF", async () => {
    const eventId = await createAndFundETH(roulette, host, 1, 0, 1, DEPOSIT);
    await roulette.connect(host).cancelEvent(eventId);

    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.CANCELLED);
  });

  it("admin can emergency cancel", async () => {
    const { eventId } = await setupThroughVRF(2);
    await roulette.connect(admin).emergencyCancel(eventId, "test emergency");

    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.EMERGENCY_CANCELLED);
  });

  it("non-admin cannot emergency cancel", async () => {
    const eventId = await createAndFundETH(roulette, host, 1, 0, 1, DEPOSIT);
    await expect(
      roulette.connect(host).emergencyCancel(eventId, "hack")
    ).to.be.revertedWith("Base: not admin");
  });

  it("refunds unused funds after cancel", async () => {
    const eventId = await createAndFundETH(roulette, host, 1, 0, 1, DEPOSIT);
    await roulette.connect(host).cancelEvent(eventId);

    const hostBalBefore = await ethers.provider.getBalance(await host.getAddress());
    const tx = await roulette.connect(host).refundUnusedFunds(eventId);
    const receipt = await tx.wait();
    const gasCost = receipt!.gasUsed * receipt!.gasPrice;
    const hostBalAfter = await ethers.provider.getBalance(await host.getAddress());

    // Host should receive prizePool + gasReserve back (approximately)
    expect(hostBalAfter + gasCost).to.be.gt(hostBalBefore);
  });

  it("prevents double refund", async () => {
    const eventId = await createAndFundETH(roulette, host, 1, 0, 1, DEPOSIT);
    await roulette.connect(host).cancelEvent(eventId);
    await roulette.connect(host).refundUnusedFunds(eventId);
    await expect(
      roulette.connect(host).refundUnusedFunds(eventId)
    ).to.be.revertedWith("Base: refund already claimed");
  });

  // ── Gas Estimation ───────────────────────────────────────────────────────────

  it("estimates gas for 1 winner", async () => {
    const [units, buffer] = await roulette.estimateGasFeeForWinners(1);
    const base = await roulette.basePayoutGasUnits();
    const perW  = await roulette.gasPerWinnerUnits();
    expect(units).to.equal(base + perW);
    expect(buffer).to.equal(5000n);
  });

  it("estimates gas for 10 winners", async () => {
    const [units] = await roulette.estimateGasFeeForWinners(10);
    const base = await roulette.basePayoutGasUnits();
    const perW  = await roulette.gasPerWinnerUnits();
    expect(units).to.equal(base + perW * 10n);
  });

  it("rejects gas estimate for 0 or 11 winners", async () => {
    await expect(roulette.estimateGasFeeForWinners(0)).to.be.revertedWith("Winner count too low");
    await expect(roulette.estimateGasFeeForWinners(11)).to.be.revertedWith("Winner count too high");
  });

  // ── Treasury ─────────────────────────────────────────────────────────────────

  it("admin can withdraw treasury fees", async () => {
    const eventId = await createAndFundETH(roulette, host, 1, 0, 1, DEPOSIT);
    const ev = await roulette.getFunction("getEvent")(eventId);
    const platformFee = ev.platformFee;

    const treasuryBal = await roulette.treasuryBalance();
    expect(treasuryBal).to.equal(platformFee);

    const balBefore = await ethers.provider.getBalance(await admin.getAddress());
    await roulette.connect(admin).withdrawTreasuryFees(await admin.getAddress(), platformFee);
    const balAfter = await ethers.provider.getBalance(await admin.getAddress());
    expect(balAfter).to.be.gt(balBefore - parseEther("0.001")); // accounting for gas
  });

  // ── Pause ────────────────────────────────────────────────────────────────────

  it("pauses and blocks new events", async () => {
    await roulette.connect(admin).pause();
    await expect(
      roulette.connect(host).createEvent(ROOM_HASH, 1, 0, 0, 0)
    ).to.be.revertedWithCustomError(roulette, "EnforcedPause");
  });
});

// ─── USDC Tests ───────────────────────────────────────────────────────────────

describe("RoulettePayUSDC", () => {
  let supra: MockSupraRouter;
  let roulette: RoulettePayUSDC;
  let usdc: MockERC20;
  let admin: Signer, host: Signer;

  const DEPOSIT_USDC = parseUnits("100", 6); // 100 USDC

  beforeEach(async () => {
    [admin, host] = await ethers.getSigners();

    supra    = await ethers.deployContract("MockSupraRouter");
    usdc     = await ethers.deployContract("MockERC20", ["USD Coin", "USDC", 6]);
    roulette = await ethers.deployContract("RoulettePayUSDC", [
      await supra.getAddress(),
      await admin.getAddress(),
      await usdc.getAddress(),
    ]);

    // Mint USDC to host
    await usdc.mint(await host.getAddress(), parseUnits("10000", 6));
  });

  it("funds USDC event and calculates fee (capped at 1 USDC)", async () => {
    const tx = await roulette.connect(host).createEvent(ROOM_HASH, 1, 1, 1, 0);
    const receipt = await tx.wait();
    const eventId = (receipt!.logs[0] as any).args[0] as bigint;

    await usdc.connect(host).approve(await roulette.getAddress(), DEPOSIT_USDC);
    await roulette.connect(host).fundEvent(eventId, DEPOSIT_USDC);

    const ev = await roulette.getFunction("getEvent")(eventId);
    expect(ev.status).to.equal(EventStatus.FUNDED);
    // 5% of 100 USDC = 5 USDC, capped at 1 USDC
    expect(ev.platformFee).to.equal(parseUnits("1", 6));
    expect(ev.gasReserve).to.equal(DEPOSIT_USDC / 100n);
    expect(ev.prizePool).to.equal(DEPOSIT_USDC - ev.platformFee - ev.gasReserve);
  });

  it("requires USDC approval before funding", async () => {
    const tx = await roulette.connect(host).createEvent(ROOM_HASH, 1, 1, 1, 0);
    const receipt = await tx.wait();
    const eventId = (receipt!.logs[0] as any).args[0] as bigint;

    await expect(
      roulette.connect(host).fundEvent(eventId, DEPOSIT_USDC)
    ).to.be.reverted; // ERC20 insufficient allowance
  });

  it("runs full USDC flow: create → fund → lock → VRF → derive → batch pay", async () => {
    const signers = await ethers.getSigners();

    const tx = await roulette.connect(host).createEvent(ROOM_HASH, 2, RevealMode.ALL_AT_ONCE, PayoutMode.BATCH_TRANSFER, DistribMode.EQUAL);
    const receipt = await tx.wait();
    const eventId = (receipt!.logs[0] as any).args[0] as bigint;

    await usdc.connect(host).approve(await roulette.getAddress(), DEPOSIT_USDC);
    await roulette.connect(host).fundEvent(eventId, DEPOSIT_USDC);
    await roulette.connect(host).lockEvent(eventId, PARTICIPANT_ROOT, PARTICIPANT_COUNT);
    await roulette.connect(host).requestSupraRandomness(eventId);

    const ev = await roulette.getFunction("getEvent")(eventId);
    await supra.fulfillRandomness(ev.vrfRequestId, 98765432n);

    const wallets = [signers[5].address, signers[6].address];
    await roulette.connect(host).deriveWinners(eventId, wallets);
    await roulette.connect(host).revealAllWinners(eventId);
    await roulette.connect(host).batchTransferWinners(eventId);

    const evFinal = await roulette.getFunction("getEvent")(eventId);
    expect(evFinal.status).to.equal(EventStatus.COMPLETED);

    // Both winners should have received USDC
    for (const w of wallets) {
      expect(await usdc.balanceOf(w)).to.be.gt(0n);
    }
  });

  it("refunds USDC on cancel", async () => {
    const tx = await roulette.connect(host).createEvent(ROOM_HASH, 1, 1, 1, 0);
    const receipt = await tx.wait();
    const eventId = (receipt!.logs[0] as any).args[0] as bigint;

    await usdc.connect(host).approve(await roulette.getAddress(), DEPOSIT_USDC);
    await roulette.connect(host).fundEvent(eventId, DEPOSIT_USDC);

    const balBefore = await usdc.balanceOf(await host.getAddress());
    await roulette.connect(host).cancelEvent(eventId);
    await roulette.connect(host).refundUnusedFunds(eventId);

    const balAfter = await usdc.balanceOf(await host.getAddress());
    expect(balAfter).to.be.gt(balBefore);
  });
});
