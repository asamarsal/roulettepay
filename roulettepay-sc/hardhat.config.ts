import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    arbitrumSepolia: {
      url:      process.env.ARBITRUM_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId:  421614,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    arbitrum: {
      url:      process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      chainId:  42161,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      arbitrumOne:     process.env.ARBISCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled:  process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests:   "./test",
    cache:   "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
