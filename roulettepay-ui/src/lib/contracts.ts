import type { Address } from "viem";

export const roulettePayContracts = {
  eth: process.env.NEXT_PUBLIC_ROULETTE_PAY_ETH_ADDRESS as Address | undefined,
  usdc: process.env.NEXT_PUBLIC_ROULETTE_PAY_USDC_ADDRESS as Address | undefined,
  usdt: process.env.NEXT_PUBLIC_ROULETTE_PAY_USDT_ADDRESS as Address | undefined,
};

export const tokenAddresses = {
  usdc: (process.env.NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS ||
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831") as Address,
  usdt: (process.env.NEXT_PUBLIC_ARBITRUM_USDT_ADDRESS ||
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9") as Address,
};

export function compactAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
