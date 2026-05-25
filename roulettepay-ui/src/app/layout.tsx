import type { Metadata } from "next";
import { ThemeProvider } from "@/src/providers/theme-provider";
import { Web3Provider } from "@/src/providers/web3-provider";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoulettePay | Fair On-Chain Giveaways",
  description:
    "Run transparent on-chain giveaways with provably fair roulette, Arbitrum payouts, and smart contract security.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Web3Provider>{children}</Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
