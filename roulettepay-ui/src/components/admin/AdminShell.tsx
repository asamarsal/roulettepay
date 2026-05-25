"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import {
  Activity,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Gauge,
  Moon,
  Radio,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { compactAddress } from "@/src/lib/contracts";

type AdminSection = "dashboard" | "events" | "roulette" | "live-rooms" | "participants" | "treasury" | "transactions" | "settings";

const topNavItems = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Events", href: "/dashboard", key: "events" },
  { label: "Live Rooms", href: "/live-rooms", key: "live-rooms" },
  { label: "Participants", href: "/dashboard", key: "participants" },
  { label: "Treasury", href: "/dashboard", key: "treasury" },
] as const;

const sideNavItems = [
  ["Dashboard", "/dashboard", "dashboard", Gauge],
  ["Events", "/dashboard", "events", Calendar],
  ["Roulette Pay", "/dashboard", "roulette", Activity],
  ["Live Rooms", "/live-rooms", "live-rooms", Radio],
  ["Participants", "/dashboard", "participants", Users],
  ["Treasury", "/dashboard", "treasury", Wallet],
  ["Transactions", "/dashboard", "transactions", FileText],
  ["Settings", "/dashboard", "settings", Settings],
] as const;

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-surface)] text-sm font-black text-[var(--rp-gold)] backdrop-blur-xl transition hover:border-[var(--rp-border-gold)]"
    >
      {isDark ? <Sun size={19} strokeWidth={2.6} /> : <Moon size={19} strokeWidth={2.6} />}
    </button>
  );
}

function BrandLogo({ className = "" }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const logoSrc =
    resolvedTheme === "light"
      ? "/logo/png/roulettepay-original.png"
      : "/logo/png/roulettepay-lightmode.png";

  return (
    <span className={`relative block h-10 w-[180px] ${className}`}>
      <Image
        src={logoSrc}
        alt="RoulettePay"
        fill
        priority
        sizes="180px"
        className="object-contain object-left"
      />
    </span>
  );
}

function WalletConnectButton({ compact = false }: { compact?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const connected = mounted && account && chain;

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-500"
            >
              <Wallet size={16} />
              {compact ? "Connect" : "Connect Wallet"}
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-400/40 bg-red-500/15 px-4 text-sm font-black text-red-200"
            >
              Wrong Network
            </button>
          );
        }

        return (
          <div className="inline-flex items-center gap-2">
            {!compact ? (
              <button
                type="button"
                onClick={openChainModal}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--rp-border-gold)] bg-[var(--rp-surface)] px-3 text-sm font-bold text-[var(--rp-gold)]"
              >
                {chain.hasIcon && chain.iconUrl ? (
                  <Image src={chain.iconUrl} alt="" width={18} height={18} />
                ) : (
                  <Image src="/icon/arbitrum-coin.png" alt="" width={18} height={18} />
                )}
                {chain.name}
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={openAccountModal}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-surface)] px-4 text-sm font-bold text-[var(--rp-text)]"
            >
              {account.displayName}
              <Copy size={14} className="text-[var(--rp-muted)]" />
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

function MobileWalletStatus() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const networkLabel =
    chainId === 42161 ? "Arbitrum One" : chainId === 421614 ? "Arbitrum Sepolia" : "Unknown";

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-white/10 bg-[#0a1424] px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Network
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-black text-white">
          <Image src="/icon/arbitrum-coin.png" alt="" width={20} height={20} />
          {isConnected ? networkLabel : "Connect"}
          <span className={`ml-auto h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-slate-500"}`} />
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-[#071622] px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Wallet
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-black text-emerald-400">
            {isConnected ? compactAddress(address) : "Not connected"}
          </p>
          <WalletConnectButton compact />
        </div>
      </div>
    </div>
  );
}

function TopBar({ active }: { active: AdminSection }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--rp-border)] bg-[rgba(248,245,237,0.72)] backdrop-blur-2xl dark:bg-[rgba(2,7,17,0.82)]">
      <nav className="grid h-20 w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:px-8">
        <Link href="/" className="justify-self-start">
          <BrandLogo />
        </Link>

        <div className="hidden items-center justify-center gap-8 lg:flex">
          {topNavItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`relative text-sm font-semibold transition hover:text-[var(--rp-gold)] ${
                active === item.key ? "text-[var(--rp-gold)]" : "text-[var(--rp-text)]"
              }`}
            >
              {item.label}
              {active === item.key ? (
                <span className="absolute -bottom-4 left-0 h-px w-full bg-[var(--rp-gold)]" />
              ) : null}
            </Link>
          ))}
        </div>

        <div className="hidden items-center justify-self-end gap-3 lg:flex">
          <ThemeToggle />
          <WalletConnectButton />
        </div>

        <div className="flex items-center justify-self-end gap-3 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-label="Open navigation menu"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-surface)]"
          >
            <X size={18} className={`text-[var(--rp-text)] ${open ? "" : "hidden"}`} />
            {!open ? (
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
                <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
                <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
              </span>
            ) : null}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-[var(--rp-border)] bg-[var(--rp-bg)] px-5 py-6 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {topNavItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-surface)] px-4 py-3 text-sm font-bold text-[var(--rp-text)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MobileQuickNav({ active }: { active: AdminSection }) {
  return (
    <div className="border-b border-white/10 bg-[#07101e]/86 px-3 py-3 backdrop-blur-xl lg:hidden">
      <MobileWalletStatus />
      <nav className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sideNavItems.map(([label, href, key, Icon]) => (
          <Link
            key={key}
            href={href}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-black ${
              active === key
                ? "border-blue-500/60 bg-blue-600/18 text-blue-300"
                : "border-white/10 bg-white/[0.03] text-slate-300"
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Sidebar({ active }: { active: AdminSection }) {
  return (
    <aside className="hidden min-h-[calc(100vh-5rem)] w-[278px] shrink-0 border-r border-white/10 bg-[#07101e]/80 p-4 lg:block">
      <section className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0d1728]/82 p-4">
        <Image src="/logo/png/roulette-icon.png" alt="" width={50} height={50} />
        <div className="min-w-0 flex-1">
          <p className="font-black text-white">Roulette Pay</p>
          <p className="text-sm text-slate-300">Admin Console</p>
        </div>
        <ChevronDown size={17} className="-rotate-90 text-slate-400" />
      </section>

      <nav className="mt-6 space-y-2">
        {sideNavItems.map(([label, href, key, Icon]) => (
          <Link
            key={key}
            href={href}
            className={`flex min-h-12 items-center gap-4 rounded-lg border px-4 text-sm font-bold transition ${
              active === key
                ? "border-blue-500/60 bg-blue-600/16 text-blue-400"
                : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>

      <section className="mt-24 rounded-xl border border-white/10 bg-[#0d1728]/82 p-5">
        <div className="mb-5 flex items-center gap-3 text-emerald-400">
          <ShieldCheck size={24} />
          <p className="font-black">Secure by Design</p>
        </div>
        {["VRF Randomness", "On-chain Settlement", "Auto Payout", "Secure Room"].map((item) => (
          <div key={item} className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-200">{item}</span>
            <Check size={17} className="text-emerald-400" />
          </div>
        ))}
      </section>
      <p className="mt-10 px-4 text-sm text-slate-400">BraindropHQ (c) 2024</p>
    </aside>
  );
}

export function AdminShell({
  active,
  children,
}: {
  active: AdminSection;
  children: React.ReactNode;
}) {
  return (
    <main
      id="admin"
      className="min-h-screen bg-[#050b16] text-slate-200 [color-scheme:dark]"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_60%_10%,rgba(37,99,235,0.14),transparent_30%),radial-gradient(circle_at_30%_60%,rgba(246,200,95,0.09),transparent_34%),#050b16]" />
      <TopBar active={active} />
      <div className="pt-20">
        <MobileQuickNav active={active} />
        <div className="flex">
          <Sidebar active={active} />
          <div className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function AdminPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-white/10 bg-[#0d1728]/82 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-4 ${className}`}>
      {children}
    </section>
  );
}
