import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // ─── Config ────────────────────────────────────────────────────────────────
  const SUPRA_ROUTER  = process.env.SUPRA_ROUTER_ADDRESS!;
  const TREASURY      = process.env.PLATFORM_TREASURY_ADDRESS!;
  const USDC_ADDRESS  = process.env.ARBITRUM_USDC_ADDRESS!;
  const USDT_ADDRESS  = process.env.ARBITRUM_USDT_ADDRESS!;

  if (!SUPRA_ROUTER || !TREASURY || !USDC_ADDRESS || !USDT_ADDRESS) {
    throw new Error("Missing required env variables");
  }

  // ETH max fee ~0.0003 ETH ≈ $1 at $3000/ETH (adjust as needed)
  const MAX_ETH_FEE = ethers.parseEther("0.0003");

  // ─── Deploy ────────────────────────────────────────────────────────────────

  console.log("\n1. Deploying RoulettePayETH...");
  const ETH = await ethers.deployContract("RoulettePayETH", [
    SUPRA_ROUTER, TREASURY, MAX_ETH_FEE,
  ]);
  await ETH.waitForDeployment();
  console.log("   RoulettePayETH:", await ETH.getAddress());

  console.log("\n2. Deploying RoulettePayUSDC...");
  const USDC = await ethers.deployContract("RoulettePayUSDC", [
    SUPRA_ROUTER, TREASURY, USDC_ADDRESS,
  ]);
  await USDC.waitForDeployment();
  console.log("   RoulettePayUSDC:", await USDC.getAddress());

  console.log("\n3. Deploying RoulettePayUSDT...");
  const USDT = await ethers.deployContract("RoulettePayUSDT", [
    SUPRA_ROUTER, TREASURY, USDT_ADDRESS,
  ]);
  await USDT.waitForDeployment();
  console.log("   RoulettePayUSDT:", await USDT.getAddress());

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Deployment Complete ===");
  console.log(`ROULETTE_PAY_ETH_ADDRESS=${await ETH.getAddress()}`);
  console.log(`ROULETTE_PAY_USDC_ADDRESS=${await USDC.getAddress()}`);
  console.log(`ROULETTE_PAY_USDT_ADDRESS=${await USDT.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
