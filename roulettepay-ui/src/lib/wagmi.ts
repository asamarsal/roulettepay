"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "MISSING_PROJECT_ID";

export const supportedChains = [arbitrum, arbitrumSepolia] as const;

export const wagmiConfig = getDefaultConfig({
  appName: "RoulettePay",
  projectId: walletConnectProjectId,
  chains: supportedChains,
  ssr: true,
  transports: {
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ||
        process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    ),
  },
});
