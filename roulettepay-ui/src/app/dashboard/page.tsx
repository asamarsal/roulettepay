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
  ExternalLink,
  Eye,
  FileText,
  Gauge,
  Lock,
  Moon,
  MoreHorizontal,
  Radio,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Sun,
  Trophy,
  Unlock,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { compactAddress, roulettePayContracts } from "@/src/lib/contracts";

const players = [
  "Ali",
  "Beatriz",
  "Charles",
  "Diya",
  "Eric",
  "Farah",
  "Gilang",
  "Hana",
];

const auditLog = [
  ["Wallet Connected", "0x4aE9...7d3f", "14:28:12", "green"],
  ["Room Created", "Q2 Giveaway Room", "14:29:01", "green"],
  ["Contract Ready", "Ready to accept USDC", "14:29:15", "green"],
  ["USDC Approved", "1,000.00 USDC", "14:30:02", "blue"],
  ["Contract Funded", "1,000.00 USDC", "14:30:18", "blue"],
  ["Waiting to Start Spin", "Lock room to proceed", "--", "slate"],
];

const topNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Events", href: "/dashboard" },
  { label: "Live Rooms", href: "/live-rooms" },
  { label: "Participants", href: "/dashboard" },
  { label: "Treasury", href: "/dashboard" },
];

const navItems = [
  ["Dashboard", "/dashboard", Gauge],
  ["Events", "/dashboard", Calendar],
  ["Roulette Pay", "/dashboard", Activity],
  ["Live Rooms", "/live-rooms", Radio],
  ["Participants", "/dashboard", Users],
  ["Treasury", "/dashboard", Wallet],
  ["Transactions", "/dashboard", FileText],
  ["Settings", "/dashboard", Settings],
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

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-[#0d1728]/82 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-4 ${className}`}
    >
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  className = "",
  right,
}: {
  label: string;
  value: string;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <div className="mt-2 flex min-h-10 items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#081224] px-3 text-sm font-medium text-white">
        <span className="truncate">{value}</span>
        {right}
      </div>
    </label>
  );
}

function StepTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-400/60 bg-blue-500/10 text-sm font-bold text-white">
        {step}
      </span>
      <h2 className="text-base font-black text-white">{title}</h2>
    </div>
  );
}

function SmallButton({
  children,
  variant = "dark",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "blue" | "green" | "gold" | "purple" | "dark";
  className?: string;
}) {
  const styles = {
    blue: "border-blue-400/30 bg-blue-600 text-white hover:bg-blue-500",
    green: "border-emerald-400/30 bg-emerald-600 text-white hover:bg-emerald-500",
    gold: "border-amber-400/40 bg-amber-500/12 text-amber-300 hover:bg-amber-500/20",
    purple: "border-purple-400/30 bg-purple-500/16 text-purple-200 hover:bg-purple-500/24",
    dark: "border-white/10 bg-[#0a1424] text-white hover:bg-white/5",
  }[variant];

  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${styles} ${className}`}
    >
      {children}
    </button>
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
        const ready = mounted;
        const connected = ready && account && chain;

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

function WalletStatusCard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const networkLabel =
    chainId === 42161 ? "Arbitrum One" : chainId === 421614 ? "Arbitrum Sepolia" : "Unknown";

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-[#0a1424] px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Network
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-black text-white">
          <Image src="/icon/arbitrum-coin.png" alt="" width={20} height={20} />
          {isConnected ? networkLabel : "Connect first"}
          <span
            className={`ml-auto h-2 w-2 rounded-full ${
              isConnected ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
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
    </>
  );
}

function ConnectedWalletField() {
  const { address, isConnected } = useAccount();

  return (
    <Field
      label="Connected Wallet"
      value={isConnected ? compactAddress(address) : "Connect wallet first"}
      right={<Copy size={15} className="text-slate-400" />}
    />
  );
}

function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--rp-border)] bg-[rgba(248,245,237,0.72)] backdrop-blur-2xl dark:bg-[rgba(2,7,17,0.82)]">
      <nav className="grid h-20 w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:px-8">
        {/* Logo */}
        <Link href="/" className="justify-self-start">
          <BrandLogo />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center justify-center gap-8 lg:flex">
          {topNavItems.map((item, index) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`relative text-sm font-semibold transition hover:text-[var(--rp-gold)] ${index === 0 ? "text-[var(--rp-gold)]" : "text-[var(--rp-text)]"
                }`}
            >
              {item.label}
              {index === 0 ? (
                <span className="absolute -bottom-4 left-0 h-px w-full bg-[var(--rp-gold)]" />
              ) : null}
            </Link>
          ))}
        </div>

        {/* Desktop right actions */}
        <div className="hidden items-center justify-self-end gap-3 lg:flex">
          <ThemeToggle />
          <WalletConnectButton />
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center justify-self-end gap-3 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-label="Open navigation menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border border-[var(--rp-border)] bg-[var(--rp-surface)]"
          >
            {open ? (
              <X size={18} className="text-[var(--rp-text)]" />
            ) : (
              <>
                <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
                <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
                <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open ? (
        <div className="border-t border-[var(--rp-border)] bg-[var(--rp-bg)] px-5 py-6 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {topNavItems.map((item) => (
              <Link
                key={item.href + item.label}
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

function MobileQuickNav() {
  return (
    <div className="border-b border-white/10 bg-[#07101e]/86 px-3 py-3 backdrop-blur-xl lg:hidden">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <WalletStatusCard />
      </div>
      <nav className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map(([label, href, Icon]) => {
          const active = label === "Roulette Pay";

          return (
            <Link
              key={label}
              href={href}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-black ${active
                ? "border-blue-500/60 bg-blue-600/18 text-blue-300"
                : "border-white/10 bg-white/[0.03] text-slate-300"
                }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-[278px] shrink-0 border-r border-white/10 bg-[#07101e]/80 p-4 lg:block">
      <Panel className="flex items-center gap-3 p-4">
        <Image src="/logo/png/roulette-icon.png" alt="" width={50} height={50} />
        <div className="min-w-0 flex-1">
          <p className="font-black text-white">Roulette Pay</p>
          <p className="text-sm text-slate-300">Admin Console</p>
        </div>
        <ChevronDown size={17} className="-rotate-90 text-slate-400" />
      </Panel>

      <nav className="mt-6 space-y-2">
        {navItems.map(([label, href, Icon]) => {
          const active = label === "Roulette Pay";

          return (
            <Link
              key={label}
              href={href}
              className={`flex min-h-12 items-center gap-4 rounded-lg border px-4 text-sm font-bold transition ${active
                ? "border-blue-500/60 bg-blue-600/16 text-blue-400"
                : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Panel className="mt-24 p-5">
        <div className="mb-5 flex items-center gap-3 text-emerald-400">
          <ShieldCheck size={24} />
          <p className="font-black">Secure by Design</p>
        </div>
        {["VRF Randomness", "On-chain Settlement", "Auto Payout", "Secure Room"].map(
          (item) => (
            <div key={item} className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-200">{item}</span>
              <Check size={17} className="text-emerald-400" />
            </div>
          ),
        )}
      </Panel>
      <p className="mt-10 px-4 text-sm text-slate-400">BraindropHQ (c) 2024</p>
    </aside>
  );
}

function EventDetails() {
  return (
    <Panel>
      <StepTitle step="1" title="Event Details" />
      <div className="grid gap-3">
        <Field label="Event Title" value="Q2 Community Giveaway" />
        <Field label="Room Title" value="Q2 Giveaway Room" />
        <Field
          label="Room Password / Secure Code"
          value="••••••••••••"
          right={<Eye size={15} className="text-slate-400" />}
        />
        <div>
          <span className="text-xs font-medium text-slate-300">Event Type</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-lg border border-blue-500 bg-blue-600/12 p-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-black text-white">
                <span className="h-4 w-4 rounded-full border-4 border-blue-500" />
                Manual Input
              </span>
              <span className="mt-1 block pl-6 text-xs text-slate-300">
                Add players manually
              </span>
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-[#081224] p-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-black text-white">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                Live Room
              </span>
              <span className="mt-1 block pl-6 text-xs text-slate-300">
                Real-time join via link
              </span>
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Max Participants" value="100" right={<Users size={15} />} />
          <Field label="Join Deadline (UTC)" value="May 20, 2024   23:59" />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_76px]">
          <Field
            label="Invite Link & QR Code"
            value="https://braindrop-hq.vercel.app/roulette/abc123"
            right={<Copy size={15} className="text-slate-400" />}
          />
          <div className="mt-6 grid h-[76px] place-items-center rounded-lg border border-white/10 bg-white p-1">
            <div className="h-14 w-14 bg-[linear-gradient(90deg,#111_25%,transparent_25%_50%,#111_50%_75%,transparent_75%),linear-gradient(#111_25%,transparent_25%_50%,#111_50%_75%,transparent_75%)] bg-[length:12px_12px]" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PrizeConfig() {
  return (
    <Panel>
      <StepTitle step="2" title="Prize & Payout Configuration" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Asset"
          value="USDC (Arbitrum)"
          right={<ChevronDown size={15} className="text-slate-400" />}
        />
        <Field label="Total Prize Pool" value="1,000.00          USDC" />
        <Field label="Number of Winners" value="3" />
        <label className="block">
          <span className="text-xs font-medium text-slate-300">Prize Distribution</span>
          <div className="mt-2 grid grid-cols-3 rounded-lg border border-white/10 bg-[#081224] p-1">
            {["Equal", "Ranked", "Custom"].map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-bold ${item === "Ranked" ? "bg-blue-600 text-white" : "text-slate-300"
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:hidden">
        {[
          ["1", "Winner 1", "500.00 USDC", "50%", "bg-amber-400 text-slate-950"],
          ["2", "Winner 2", "300.00 USDC", "30%", "bg-slate-300 text-slate-900"],
          ["3", "Winner 3", "200.00 USDC", "20%", "bg-orange-400 text-white"],
        ].map((row) => (
          <div
            key={row[0]}
            className="rounded-lg border border-white/10 bg-[#081224] p-3"
          >
            <div className="flex items-center gap-3">
              <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${row[4]}`}>
                {row[0]}
              </span>
              <span className="font-black text-white">{row[1]}</span>
              <span className="ml-auto rounded-full bg-emerald-500/12 px-2 py-1 text-xs font-black text-emerald-300">
                {row[3]}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-400">Payout</span>
              <span className="font-black text-white">{row[2]}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 font-black">
          <span className="text-white">Total</span>
          <span className="text-white">1,000.00 USDC</span>
          <span className="text-emerald-400">100%</span>
        </div>
      </div>
      <div className="mt-4 hidden overflow-hidden rounded-lg border border-white/10 sm:block">
        <div className="grid grid-cols-[0.6fr_1.2fr_1fr_0.7fr] bg-[#081224] px-3 py-3 text-[11px] font-black uppercase text-slate-400">
          <span>Rank</span>
          <span>Winner</span>
          <span>Payout</span>
          <span>% of Pool</span>
        </div>
        {[
          ["1", "Winner 1", "500.00 USDC", "50%", "bg-amber-400 text-slate-950"],
          ["2", "Winner 2", "300.00 USDC", "30%", "bg-slate-300 text-slate-900"],
          ["3", "Winner 3", "200.00 USDC", "20%", "bg-orange-400 text-white"],
        ].map((row) => (
          <div
            key={row[0]}
            className="grid grid-cols-[0.6fr_1.2fr_1fr_0.7fr] items-center border-t border-white/10 px-3 py-3 text-sm text-white"
          >
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${row[4]}`}>
              {row[0]}
            </span>
            <span>{row[1]}</span>
            <span>{row[2]}</span>
            <span>{row[3]}</span>
          </div>
        ))}
        <div className="grid grid-cols-[1.8fr_1fr_0.7fr] border-t border-white/10 px-3 py-3 font-black text-white">
          <span>Total</span>
          <span>1,000.00 USDC</span>
          <span className="text-emerald-400">100%</span>
        </div>
      </div>
    </Panel>
  );
}

function FundingPanel() {
  return (
    <Panel>
      <StepTitle step="3" title="Smart Contract Funding" />
      <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/12 p-4">
        <p className="flex items-center gap-2 font-black text-emerald-300">
          <ShieldCheck size={19} />
          Ready to Fund
        </p>
        <p className="pl-7 text-sm text-slate-300">Contract is ready to accept funds</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ConnectedWalletField />
        <Field label="Network" value="Arbitrum" />
      </div>
      <Field
        className="mt-3"
        label="Smart Contract"
        value={
          roulettePayContracts.usdc
            ? compactAddress(roulettePayContracts.usdc)
            : "Set NEXT_PUBLIC_ROULETTE_PAY_USDC_ADDRESS"
        }
        right={
          <span className="flex gap-2 text-slate-400">
            <Copy size={15} />
            <ExternalLink size={15} />
          </span>
        }
      />
      <div className="mt-3 flex justify-between text-sm text-slate-300">
        <span>Contract Balance</span>
        <span className="rounded bg-white/5 px-2 py-1 font-bold text-white">0.00 USDC</span>
      </div>
      <Field className="mt-3" label="Amount to Fund" value="1,000.00          USDC" />
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-slate-300">Estimated Gas</span>
        <span className="font-bold text-white">~0.0021 ETH</span>
        <span className="rounded bg-white/5 px-2 text-slate-300">$3.42</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SmallButton variant="blue">Approve USDC</SmallButton>
        <SmallButton variant="green">Fund Smart Contract</SmallButton>
      </div>
      <SmallButton className="mt-3 w-full">Withdraw Unused Funds</SmallButton>
    </Panel>
  );
}

function ParticipantsPanel() {
  return (
    <Panel className="lg:col-span-2">
      <StepTitle step="4" title="Participants (8 / 100)" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex min-h-10 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#081224] px-3 text-sm text-slate-400">
          <Search size={17} />
          Search players...
        </div>
        <SmallButton variant="blue">+ Add Player</SmallButton>
        <SmallButton>
          <Shuffle size={16} />
          Shuffle
        </SmallButton>
        <SmallButton>
          <SlidersHorizontal size={16} />
          Sort
        </SmallButton>
        <SmallButton>
          <MoreHorizontal size={16} />
        </SmallButton>
      </div>
      <div className="grid gap-3 sm:hidden">
        {players.map((player, index) => (
          <div
            key={player}
            className="rounded-lg border border-white/10 bg-[#081224] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500/14 text-xs font-black text-blue-300">
                  {index + 1}
                </span>
                <div>
                  <p className="font-black text-white">{player}</p>
                  <p className="text-xs text-slate-400">
                    May 19, 2024 14:{String(32 + index).padStart(2, "0")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400"
              >
                Remove
              </button>
            </div>
            <p className="mt-3 text-sm font-bold text-emerald-400">✓ Joined</p>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-white/10">
              <th className="py-3">#</th>
              <th>Player Name</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player} className="border-b border-white/[0.06] text-slate-200">
                <td className="py-3">{index + 1}</td>
                <td className="font-bold text-white">{player}</td>
                <td>May 19, 2024 14:{String(32 + index).padStart(2, "0")}</td>
                <td className="text-emerald-400">✓ Joined</td>
                <td className="text-slate-400">⌫</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ControlsPanel() {
  return (
    <Panel>
      <StepTitle step="5" title="Event Controls" />
      <div className="grid gap-3 sm:grid-cols-3">
        <SmallButton variant="green">
          <Unlock size={17} />
          Open Room
        </SmallButton>
        <SmallButton variant="gold">
          <Lock size={17} />
          Lock Room
        </SmallButton>
        <SmallButton variant="blue">
          <RotateCw size={17} />
          Sync Players
        </SmallButton>
      </div>
      <div className="my-5 h-px bg-white/20" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SmallButton variant="purple" className="min-h-20 justify-start px-5 text-left">
          <Activity size={24} />
          <span>
            <span className="block text-base">Start Spin</span>
            <span className="block text-sm font-medium text-slate-300">Uses VRF randomness</span>
          </span>
        </SmallButton>
        <SmallButton variant="green" className="min-h-20 justify-start px-5 text-left">
          <Trophy size={24} />
          <span>
            <span className="block text-base">Settle Winners</span>
            <span className="block text-sm font-medium text-slate-200">Auto payout on-chain</span>
          </span>
        </SmallButton>
      </div>
      <div className="mt-4 rounded-lg border border-blue-400/20 bg-blue-500/14 px-4 py-3 text-sm text-blue-200">
        Room must be locked before starting the spin.
      </div>
    </Panel>
  );
}

function WheelPreview() {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-black text-white">Event Summary</h2>
          <p className="mt-4 font-black text-white">Q2 Community Giveaway</p>
        </div>
        <span className="rounded-md bg-emerald-500/16 px-3 py-1 text-xs font-black text-emerald-400">
          Draft
        </span>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        {[
          ["Type", "Manual Input"],
          ["Max Participants", "100"],
          ["Winners", "3"],
          ["Total Prize Pool", "1,000.00 USDC"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-bold text-white">{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-6 font-black text-white">Wheel Preview</h3>
      <div className="relative mx-auto mt-4 h-56 w-56">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ef4444_0_45deg,#3b82f6_45deg_90deg,#f59e0b_90deg_135deg,#14b8a6_135deg_180deg,#8b5cf6_180deg_225deg,#84cc16_225deg_270deg,#ec4899_270deg_315deg,#2dd4bf_315deg_360deg)] shadow-[0_0_36px_rgba(59,130,246,0.22)]" />
        <div className="absolute inset-4 rounded-full border-[12px] border-[#0b1424]/80" />
        <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-black text-slate-950">
          SPIN
        </div>
        <div className="absolute -right-1 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[12px] border-l-[24px] border-y-transparent border-l-amber-400" />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-300">8 Segments</span>
        <SmallButton>
          <RotateCw size={15} />
          Refresh Preview
        </SmallButton>
      </div>
    </Panel>
  );
}

function AuditPanel() {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-white">Activity / Audit Log</h2>
        <a href="#admin" className="text-xs font-bold text-blue-400">
          View All
        </a>
      </div>
      <div className="space-y-4">
        {auditLog.map(([title, detail, time, tone]) => (
          <div key={title} className="grid grid-cols-[12px_34px_1fr_auto] items-start gap-3">
            <span
              className={`mt-3 h-3 w-3 rounded-full ${tone === "green"
                ? "bg-emerald-400"
                : tone === "blue"
                  ? "bg-blue-500"
                  : "bg-slate-500"
                }`}
            />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/7 text-slate-300">
              <Wallet size={16} />
            </span>
            <span>
              <span className="block text-sm font-bold text-white">{title}</span>
              <span className="block text-xs text-slate-400">{detail}</span>
            </span>
            <span className="text-xs text-slate-400">{time}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function DashboardPage() {
  return (
    <main
      id="admin"
      className="min-h-screen bg-[#050b16] text-slate-200 [color-scheme:dark]"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_60%_10%,rgba(37,99,235,0.14),transparent_30%),radial-gradient(circle_at_30%_60%,rgba(246,200,95,0.09),transparent_34%),#050b16]" />
      <TopBar />
      <MobileQuickNav />
      <div className="flex pt-20">
        <Sidebar />
        <div className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">
          <div className="mb-4 rounded-xl border border-white/10 bg-[#0d1728]/62 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:mb-5 sm:border-l-4 sm:border-blue-500/70 sm:bg-transparent sm:pl-5 sm:shadow-none">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-300">
              Roulette setup page
            </p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Roulette Pay Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Create, fund and manage your roulette events on-chain.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <div className="grid gap-4">
              <div className="grid gap-4 2xl:grid-cols-3">
                <EventDetails />
                <PrizeConfig />
                <FundingPanel />
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <ParticipantsPanel />
                <ControlsPanel />
              </div>
            </div>
            <aside className="grid content-start gap-4">
              <WheelPreview />
              <AuditPanel />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
