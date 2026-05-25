"use client";

import {
  Copy,
  ExternalLink,
  Eye,
  Lock,
  Play,
  Plus,
  Search,
  Shuffle,
  SlidersHorizontal,
  Square,
  Trash2,
  Trophy,
  Unlock,
  User,
  Wallet,
} from "lucide-react";
import { AdminPanel, AdminShell } from "@/src/components/admin/AdminShell";
import { compactAddress, roulettePayContracts } from "@/src/lib/contracts";

const participants = [
  { name: "asa", wallet: "0xa12b...45f6", color: "bg-red-400", joined: "14:32:11" },
  { name: "ujang", wallet: "0x8f7c...9b21", color: "bg-blue-400", joined: "14:31:48" },
  { name: "ali", wallet: "0xbe33...77aa", color: "bg-amber-400", joined: "14:30:22" },
];

const liveActivity = [
  ["ali (0xbe33...77aa) joined the room", "14:30:22", User],
  ["Wallet connected: ali (0xbe33...77aa)", "14:30:22", Wallet],
  ["Room locked by host", "14:29:55", Lock],
  ["Spin started", "14:29:50", Play],
  ["Winner settled: ujang (0x8f7c...9b21) • Prize: 333.33 USDC", "14:29:41", Trophy],
];

function ActionButton({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "green" | "gold" | "blue" | "red" | "dark";
}) {
  const styles = {
    green: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/16",
    gold: "border-amber-400/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/16",
    blue: "border-blue-400/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/16",
    red: "border-red-400/50 bg-red-500/10 text-red-300 hover:bg-red-500/16",
    dark: "border-white/10 bg-[#0a1424] text-white hover:bg-white/5",
  }[tone];

  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition ${styles}`}
    >
      {children}
    </button>
  );
}

function RoomHeader() {
  return (
    <AdminPanel>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.7fr_0.8fr_1.1fr_0.65fr] lg:items-center">
        <div>
          <p className="text-xs text-slate-400">Room Title</p>
          <h2 className="mt-2 text-xl font-black text-white">Q2 Community Giveaway</h2>
        </div>
        <div>
          <p className="text-xs text-slate-400">Room Type</p>
          <span className="mt-2 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white">
            Manual Input
          </span>
        </div>
        <div>
          <p className="text-xs text-slate-400">Room Code</p>
          <p className="mt-2 flex items-center gap-3 text-xl font-black text-white">
            <Lock size={17} className="text-slate-400" />
            BG7K9P
            <Eye size={16} className="text-slate-400" />
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Join Link</p>
          <p className="mt-2 flex items-center gap-3 truncate text-sm font-black text-blue-400 sm:text-base">
            braindrop.live/room/BG7K9P
            <Copy size={15} className="shrink-0 text-slate-400" />
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">QR Code</p>
          <div className="mt-2 grid h-20 w-20 place-items-center rounded-lg bg-white p-2">
            <div className="h-14 w-14 bg-[linear-gradient(90deg,#111_25%,transparent_25%_50%,#111_50%_75%,transparent_75%),linear-gradient(#111_25%,transparent_25%_50%,#111_50%_75%,transparent_75%)] bg-[length:10px_10px]" />
          </div>
        </div>
      </div>
    </AdminPanel>
  );
}

function RouletteWheelPanel() {
  return (
    <AdminPanel className="min-h-[360px]">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-white">Roulette Wheel <span className="text-sm font-medium text-slate-300">(Live Preview)</span></h2>
        <p className="flex items-center gap-2 text-sm font-black text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live
        </p>
      </div>
      <div className="relative mx-auto mt-6 h-64 w-64 sm:h-80 sm:w-80">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_30deg,#ef4444_0_120deg,#3b82f6_120deg_200deg,#f59e0b_200deg_360deg)] shadow-[0_0_50px_rgba(59,130,246,0.25)]" />
        <div className="absolute inset-2 rounded-full border-[10px] border-[#132033]/90" />
        <span className="absolute right-9 top-16 rotate-45 text-sm font-black text-white">asa</span>
        <span className="absolute bottom-16 right-24 rotate-[-48deg] text-sm font-black text-white">ujang</span>
        <span className="absolute bottom-24 left-16 rotate-[-44deg] text-sm font-black text-white">ali</span>
        <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-blue-200 bg-white text-xs font-black text-slate-950">
          SPIN
        </div>
        <div className="absolute -right-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[16px] border-l-[32px] border-y-transparent border-l-red-400" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <ActionButton tone="green"><Unlock size={16} /> Open Room</ActionButton>
        <ActionButton tone="gold"><Lock size={16} /> Lock Room</ActionButton>
        <ActionButton tone="blue"><Play size={16} /> Start Spin</ActionButton>
        <ActionButton tone="red"><Square size={14} /> End Event</ActionButton>
      </div>
      <p className="mt-4 text-center text-sm text-slate-400">
        Room is open. Players can join and be added.
      </p>
    </AdminPanel>
  );
}

function ParticipantsPanel() {
  return (
    <AdminPanel>
      <h2 className="text-xl font-black text-white">Participants <span className="text-slate-300">(3 / 100)</span></h2>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex min-h-10 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#081224] px-3 text-sm text-slate-400">
          <Search size={17} />
          Search players by name or address...
        </div>
        <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white">
          <Plus size={16} />
          Add Player
        </button>
      </div>
      <div className="mt-3 flex gap-3">
        <ActionButton tone="dark"><Shuffle size={16} /> Shuffle</ActionButton>
        <ActionButton tone="dark"><SlidersHorizontal size={16} /> Sort</ActionButton>
      </div>
      <div className="mt-5 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="py-3">#</th>
              <th>Player</th>
              <th>Wallet Status</th>
              <th>Joined At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((player, index) => (
              <tr key={player.wallet} className="border-b border-white/[0.06]">
                <td className="py-4 text-slate-300">{index + 1}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${player.color}`} />
                    <div>
                      <p className="font-black text-white">{player.name}</p>
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        {player.wallet}
                        <Copy size={13} />
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="rounded-md border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-xs font-black text-emerald-300">
                    Connected
                  </span>
                </td>
                <td className="text-slate-300">{player.joined}</td>
                <td><Trash2 size={17} className="text-slate-300" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid gap-3 sm:hidden">
        {participants.map((player, index) => (
          <div key={player.wallet} className="rounded-lg border border-white/10 bg-[#081224] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${player.color}`} />
                <div>
                  <p className="font-black text-white">{index + 1}. {player.name}</p>
                  <p className="text-xs text-slate-400">{player.wallet}</p>
                </div>
              </div>
              <span className="rounded-md border border-emerald-400/30 bg-emerald-500/12 px-2 py-1 text-xs font-black text-emerald-300">
                Connected
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Joined at {player.joined}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-slate-400">Showing 3 of 3 players</p>
    </AdminPanel>
  );
}

function SummarySidebar() {
  return (
    <aside className="grid content-start gap-4">
      <AdminPanel>
        <h2 className="text-xl font-black text-white">Prize Summary</h2>
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#081224] px-3 py-2 text-sm font-black text-white">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-500/18 text-blue-300">◎</span>
          USDC (Arbitrum)
        </div>
        <div className="mt-6 space-y-6">
          <div>
            <p className="text-sm text-slate-400">Total Prize Pool</p>
            <p className="mt-1 text-2xl font-black text-white">1,000.00 USDC</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Winner Count</p>
            <p className="mt-1 text-2xl font-black text-white">3 / 10</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Payout Method</p>
            <p className="mt-1 text-xl font-black text-white">Auto Payout</p>
          </div>
        </div>
      </AdminPanel>
      <AdminPanel>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Smart Contract Status</h2>
          <span className="rounded-md bg-emerald-500/16 px-3 py-1 text-xs font-black text-emerald-300">
            Funded
          </span>
        </div>
        <div className="mt-6 grid gap-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Contract</span>
            <span className="flex items-center gap-2 font-black text-white">
              {roulettePayContracts.usdc ? compactAddress(roulettePayContracts.usdc) : "Not set"}
              <Copy size={14} className="text-slate-400" />
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Network</span>
            <span className="font-black text-white">Arbitrum One</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Current Balance</span>
            <span className="font-black text-white">1,000.00 USDC</span>
          </div>
        </div>
        <button type="button" className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-black text-slate-300">
          View on Explorer
          <ExternalLink size={15} />
        </button>
      </AdminPanel>
    </aside>
  );
}

function LiveActivityPanel() {
  return (
    <AdminPanel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Live Activity</h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Real-time event log
          </p>
        </div>
        <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-black text-white">
          View Full Log
        </button>
      </div>
      <div className="mt-4 divide-y divide-white/[0.06]">
        {liveActivity.map(([text, time, Icon]) => (
          <div key={text as string} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-3 text-sm">
            <Icon size={18} className="text-slate-300" />
            <p className="text-slate-200">{text as string}</p>
            <p className="text-slate-400">{time as string}</p>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}

export default function LiveRoomsPage() {
  return (
    <AdminShell active="live-rooms">
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black text-white sm:text-3xl">Live Room Dashboard</h1>
          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/15 px-3 py-2 text-sm font-black text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300">Manage your live roulette event in real-time.</p>
      </div>

      <RoomHeader />
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <div className="grid gap-4 2xl:grid-cols-[1fr_0.96fr]">
            <RouletteWheelPanel />
            <ParticipantsPanel />
          </div>
          <LiveActivityPanel />
        </div>
        <SummarySidebar />
      </div>
    </AdminShell>
  );
}
