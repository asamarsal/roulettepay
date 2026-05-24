"use client";

import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useScrollReveal } from "@/src/components/animations/useScrollReveal";

const assets = {
  logo: "/logo/png/roulettepay-original.png",
  logoIcon: "/logo/png/roulette-icon.png",
  hero: "/illustration/Rouletteboard.png",
  arbitrum: "/icon/arbitrum-coin.png",
  play: "/icon/play-gold.png",
  socialX: "/icon/twitter-gold.png",
  socialDiscord: "/icon/15.png",
  socialTelegram: "/icon/telegram-gold.png",
  socialGithub: "/icon/github-gold.png",
};

const trustFeatures = [
  {
    title: "Provably Fair",
    description: "100% transparent and verifiable",
    icon: "/icon/shield-border-gold.png",
  },
  {
    title: "Instant Payout",
    description: "Powered by Arbitrum for instant payment",
    icon: "/icon/instant-payout-gold.png",
  },
  {
    title: "Secure & Trustless",
    description: "Smart contract secured",
    icon: "/icon/wallet-gold.png",
  },
];

const stats = [
  {
    value: "25,648+",
    label: "Giveaways Created",
    icon: "/icon/many-people-border-gold.png",
  },
  {
    value: "1.2M+",
    label: "Winners Picked",
    icon: "/icon/prize-gold.png",
  },
  {
    value: "8.7M+ USDC",
    label: "Paid Out",
    icon: "/icon/stacked-coin-gold.png",
  },
  {
    value: "99.99%",
    label: "Uptime & Reliability",
    icon: "/icon/graph-gold.png",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Create Giveaway",
    description: "Set prize, add participants, and customize your giveaway.",
    icon: "/icon/addmore-people-gold.png",
    reveal: "left",
  },
  {
    step: "2",
    title: "Spin the Roulette",
    description: "The roulette spins with provably fair randomness on-chain.",
    icon: "/icon/roulette-color.png",
    reveal: "bottom",
  },
  {
    step: "3",
    title: "Winner is Picked",
    description: "A random winner is selected transparently and verifiably.",
    icon: "/icon/prize-gold.png",
    reveal: "top",
  },
  {
    step: "4",
    title: "Get Paid Instantly",
    description: "Prize is sent instantly to the winner via smart contract.",
    icon: "/icon/dollar-coin.png",
    reveal: "right",
  },
];

const whyChoose = [
  {
    title: "Provably Fair",
    description: "All randomness is verifiable on-chain. No manipulation, ever.",
    icon: "/icon/weightscale-gold.png",
    reveal: "left",
  },
  {
    title: "Instant & Low Fee",
    description: "Built on Arbitrum for blazing fast transactions and minimal fees.",
    icon: "/icon/ligthning-soild.png",
    reveal: "bottom",
  },
  {
    title: "Secure & Trustless",
    description: "Smart contracts handle everything. No middlemen, no risks.",
    icon: "/icon/shield-border-gold.png",
    reveal: "bottom",
  },
  {
    title: "Perfect for Any Community",
    description: "Ideal for DAOs, influencers, projects, and any token communities.",
    icon: "/icon/many-people-gold.png",
    reveal: "right",
  },
];

const moreReasons = [
  {
    title: "Built for Communities",
    description:
      "Trusted by DAOs, creators, projects, and brands to run transparent giveaways at scale.",
    icon: "/icon/group-of-people-gold.png",
    reveal: "left",
  },
  {
    title: "Flexible Prize Distribution",
    description:
      "Distribute prizes in crypto or stablecoins across multiple winners with custom rules and allocations.",
    icon: "/icon/prize-and-time-gold.png",
    reveal: "top",
  },
  {
    title: "Instant Winner Payouts",
    description:
      "Winners receive prizes instantly via smart contracts. No delays, no middlemen.",
    icon: "/icon/lightning-coin-gold.png",
    reveal: "right",
  },
];

const faqs = [
  {
    question: "How does fairness and randomness work?",
    answer:
      "RoulettePay uses verifiable on-chain randomness so winner selection can be checked transparently. The visual wheel is only the animation, while the final result is settled by smart contract logic.",
    icon: "/icon/shield-border-gold.png",
  },
  {
    question: "How are payouts sent to winners?",
    answer:
      "Prize funds are held in a smart contract. Once winners are selected, payouts can be sent directly or processed through a secure claim or relayer flow.",
    icon: "/icon/stacked-coin-gold.png",
  },
  {
    question: "Do participants need a crypto wallet?",
    answer:
      "Participants can connect their own wallet, or the app can help create a temporary wallet for beginner onboarding.",
    icon: "/icon/wallet-gold.png",
  },
  {
    question: "What assets are supported?",
    answer:
      "RoulettePay supports ETH, USDC, USDT and more on-chain assets depending on the deployed contract configuration.",
    icon: "/icon/usdc-coin.png",
  },
  {
    question: "Can I use RoulettePay for my community or project?",
    answer:
      "Yes. RoulettePay is designed for communities, events, DAOs, creators, and projects that want transparent giveaway experiences.",
    icon: "/icon/many-people-border-gold.png",
  },
];

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "FAQ", href: "#faq" },
];

const footerColumns = [
  {
    title: "Product",
    links: ["How It Works", "Features", "Benefits", "Pricing", "Launch App"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Guides", "Help Center", "Blog", "API"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Contact", "Partners", "Brand Kit"],
  },
  {
    title: "Legal",
    links: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Disclaimer"],
  },
];

type CardItem = {
  title: string;
  description: string;
  icon: string;
  reveal?: string;
  step?: string;
};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-surface)] text-sm font-black text-[var(--rp-gold)] shadow-[0_0_28px_var(--rp-shadow)] backdrop-blur-xl transition hover:border-[var(--rp-border-gold)]"
    >
      {isDark ? "L" : "D"}
    </button>
  );
}

function GoldButton({
  children,
  href = "#",
  variant = "solid",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const styles =
    variant === "solid"
      ? "border-transparent bg-[linear-gradient(135deg,#FFE496_0%,#F6C85F_42%,#C99122_100%)] text-[#100B03] shadow-[0_18px_42px_rgba(201,145,34,0.24)] hover:brightness-110"
      : "border-[var(--rp-border-gold)] bg-transparent text-[var(--rp-gold)] hover:bg-[rgba(246,200,95,0.1)]";

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border px-7 py-3 text-sm font-extrabold transition duration-300 ${styles} ${className}`}
    >
      {children}
      <span aria-hidden="true" className="text-lg leading-none">
        -&gt;
      </span>
    </a>
  );
}

function GlassCard({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={`rounded-[18px] border border-[var(--rp-border)] bg-[var(--rp-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_48px_var(--rp-shadow)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[var(--rp-border-gold)] hover:shadow-[0_0_70px_var(--rp-shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  label,
  title,
  className = "",
}: {
  label: string;
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-4xl text-center ${className}`}>
      <p
        data-reveal="top"
        className="text-xs font-black uppercase tracking-[0.28em] text-[var(--rp-gold)]"
      >
        {label}
      </p>
      <h2
        data-reveal="top"
        data-delay="0.08"
        className="mt-4 text-3xl font-black tracking-tight text-[var(--rp-text)] sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
    </div>
  );
}

function IconImage({
  src,
  alt,
  className = "h-12 w-12",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <Image src={src} alt={alt} fill sizes="96px" className="object-contain" />
    </span>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--rp-border)] bg-[rgba(248,245,237,0.72)] backdrop-blur-2xl dark:bg-[rgba(2,7,17,0.62)]">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#home" className="relative block h-12 w-[190px] sm:w-[222px]">
          <Image
            src={assets.logo}
            alt="RoulettePay"
            fill
            priority
            sizes="222px"
            className="object-contain object-left"
          />
        </a>

        <div className="hidden items-center gap-10 lg:flex">
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              className={`relative text-sm font-semibold transition hover:text-[var(--rp-gold)] ${
                index === 0 ? "text-[var(--rp-gold)]" : "text-[var(--rp-text)]"
              }`}
            >
              {item.label}
              {index === 0 ? (
                <span className="absolute -bottom-4 left-0 h-px w-full bg-[var(--rp-gold)]" />
              ) : null}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <GoldButton href="#launch" className="min-h-11 px-6 py-2">
            Launch App
          </GoldButton>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-label="Open navigation menu"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border border-[var(--rp-border)] bg-[var(--rp-surface)]"
          >
            <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
            <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
            <span className="h-0.5 w-5 rounded-full bg-[var(--rp-text)]" />
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-[var(--rp-border)] bg-[var(--rp-bg)] px-5 py-6 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-surface)] px-4 py-3 text-sm font-bold text-[var(--rp-text)]"
              >
                {item.label}
              </a>
            ))}
            <GoldButton href="#launch" className="w-full">
              Launch App
            </GoldButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function ArbitrumBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--rp-border)] bg-[var(--rp-surface)] px-4 py-2 shadow-[0_0_30px_var(--rp-shadow)] backdrop-blur-xl">
      <IconImage src={assets.arbitrum} alt="" className="h-5 w-5" />
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--rp-gold)]">
        Powered by Arbitrum
      </span>
    </div>
  );
}

function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 sm:pb-24 lg:pt-36"
    >
      <div className="pointer-events-none absolute left-1/2 top-16 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(246,200,95,0.16),transparent_68%)] blur-2xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative z-10">
          <div data-reveal="top">
            <ArbitrumBadge />
          </div>
          <h1
            data-reveal="left"
            className="mt-8 max-w-2xl text-5xl font-black leading-[0.96] tracking-tight text-[var(--rp-text)] sm:text-7xl lg:text-8xl"
          >
            Spin. Win.
            <span className="block bg-[linear-gradient(135deg,#FFE69B,#F6C85F,#B67812)] bg-clip-text text-transparent">
              Get Paid.
            </span>
          </h1>
          <p
            data-reveal="left"
            data-delay="0.1"
            className="mt-7 max-w-xl text-lg leading-8 text-[var(--rp-muted)] sm:text-xl"
          >
            The fair and transparent way to run giveaways on-chain. Spin the
            roulette, pick a winner, and pay instantly.
          </p>

          <div
            data-reveal="bottom"
            data-delay="0.18"
            className="mt-9 flex flex-col gap-4 sm:flex-row"
          >
            <GoldButton href="#launch" className="w-full sm:w-auto">
              Launch App
            </GoldButton>
            <GoldButton
              href="#how-it-works"
              variant="outline"
              className="w-full sm:w-auto"
            >
              How It Works
            </GoldButton>
          </div>

          <div
            data-reveal="bottom"
            data-delay="0.24"
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <IconImage src={feature.icon} alt="" className="h-9 w-9" />
                <div>
                  <p className="text-sm font-black text-[var(--rp-text)]">
                    {feature.title}
                  </p>
                  <p className="text-xs leading-5 text-[var(--rp-muted)]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-reveal="right" data-delay="0.1" className="relative">
          <div className="pointer-events-none absolute inset-x-8 bottom-7 h-20 rounded-full bg-[rgba(246,200,95,0.25)] blur-3xl" />
          <Image
            src={assets.hero}
            alt="Glowing RoulettePay roulette wheel"
            width={820}
            height={820}
            priority
            className="relative mx-auto h-auto w-full max-w-[720px] object-contain drop-shadow-[0_0_54px_var(--rp-shadow)]"
          />
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section id="features" className="px-5 pb-20 sm:px-8">
      <GlassCard
        data-reveal="bottom"
        className="mx-auto grid max-w-7xl gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            data-reveal="bottom"
            data-delay={String(index * 0.06)}
            className="flex items-center gap-4 border-[var(--rp-border)] py-3 lg:border-r lg:last:border-r-0"
          >
            <IconImage src={stat.icon} alt="" className="h-12 w-12" />
            <div>
              <p className="text-2xl font-black leading-none text-[var(--rp-gold)] sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--rp-muted)]">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </GlassCard>
    </section>
  );
}

function ProcessCard({ item, index }: { item: CardItem; index: number }) {
  return (
    <GlassCard
      data-reveal={item.reveal}
      data-delay={String(index * 0.05)}
      className="relative p-7 text-center"
    >
      {item.step ? (
        <span className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--rp-gold)] text-sm font-black text-[var(--rp-gold)]">
          {item.step}
        </span>
      ) : null}
      <IconImage
        src={item.icon}
        alt=""
        className="mx-auto mb-6 mt-8 h-20 w-20"
      />
      <h3 className="text-xl font-black text-[var(--rp-text)]">{item.title}</h3>
      <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-6 text-[var(--rp-muted)]">
        {item.description}
      </p>
    </GlassCard>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeader
        label="Simple. Fair. On-chain."
        title="How RoulettePay Works"
      />
      <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorks.map((item, index) => (
          <ProcessCard key={item.title} item={item} index={index} />
        ))}
      </div>
      <div data-reveal="bottom" className="mt-10 flex justify-center">
        <GoldButton href="#launch">Try It Now</GoldButton>
      </div>
    </section>
  );
}

function WhyChoose() {
  return (
    <section id="benefits" className="px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeader label="Built for communities" title="Why Choose RoulettePay?" />
      <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {whyChoose.map((item, index) => (
          <ProcessCard key={item.title} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function MoreReasons() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeader
        label="Built for every community"
        title="More Reasons to Choose RoulettePay"
      />
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
        {moreReasons.map((item, index) => (
          <GlassCard
            key={item.title}
            data-reveal={item.reveal}
            data-delay={String(index * 0.06)}
            className="p-8 text-center"
          >
            <IconImage
              src={item.icon}
              alt=""
              className="mx-auto mb-6 h-28 w-28"
            />
            <h3 className="text-xl font-black text-[var(--rp-text)]">
              {item.title}
            </h3>
            <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-[var(--rp-muted)]">
              {item.description}
            </p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(3);

  return (
    <section id="faq" className="px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeader
        label="Questions? We've got answers"
        title="Frequently Asked Questions"
      />
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <GlassCard
              key={faq.question}
              data-reveal="left"
              data-delay={String(index * 0.05)}
              className="overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-8"
              >
                <IconImage src={faq.icon} alt="" className="h-11 w-11" />
                <span className="flex-1 text-base font-black text-[var(--rp-text)] sm:text-xl">
                  {faq.question}
                </span>
                <span className="text-3xl font-light leading-none text-[var(--rp-gold)]">
                  {isOpen ? "-" : "+"}
                </span>
              </button>
              {isOpen ? (
                <p className="px-5 pb-6 pl-[5.25rem] text-sm leading-7 text-[var(--rp-muted)] sm:px-8 sm:pl-[7.1rem] sm:text-base">
                  {faq.answer}
                </p>
              ) : null}
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="launch" className="px-5 py-16 sm:px-8 sm:py-24">
      <GlassCard
        data-reveal="bottom"
        className="mx-auto grid max-w-6xl items-center gap-8 overflow-hidden border-[var(--rp-border-gold)] p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div data-reveal="left" className="relative min-h-[260px]">
          <div className="pointer-events-none absolute inset-8 rounded-full bg-[rgba(246,200,95,0.18)] blur-3xl" />
          <Image
            src="/icon/prize-on-floor-gold.png"
            alt="Golden gift for RoulettePay giveaways"
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-contain drop-shadow-[0_0_40px_var(--rp-shadow)]"
          />
        </div>
        <div data-reveal="right">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight text-[var(--rp-text)] sm:text-5xl">
            Ready to launch your next{" "}
            <span className="text-[var(--rp-gold)]">
              fair on-chain giveaway?
            </span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--rp-muted)]">
            Join thousands of communities and projects using RoulettePay to run
            provably fair, transparent, and instant giveaways.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <GoldButton href="#home" className="w-full sm:w-auto">
              Launch App
            </GoldButton>
            <GoldButton href="#home" variant="outline" className="w-full sm:w-auto">
              Book Demo
            </GoldButton>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--rp-border-gold)] px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div data-reveal="bottom">
          <a href="#home" className="relative block h-14 w-[230px]">
            <Image
              src={assets.logo}
              alt="RoulettePay"
              fill
              sizes="230px"
              className="object-contain object-left"
            />
          </a>
          <p className="mt-5 max-w-sm text-base leading-7 text-[var(--rp-muted)]">
            The fair and transparent way to run on-chain giveaways. Spin the
            roulette, pick a winner, and pay instantly.
          </p>
          <div className="mt-6 flex gap-3">
            {[assets.socialX, assets.socialDiscord, assets.socialTelegram, assets.socialGithub].map(
              (icon) => (
                <a
                  key={icon}
                  href="#home"
                  aria-label="RoulettePay social link"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--rp-border-gold)] bg-[var(--rp-surface)]"
                >
                  <IconImage src={icon} alt="" className="h-6 w-6" />
                </a>
              ),
            )}
          </div>
          <div className="mt-6">
            <ArbitrumBadge />
          </div>
        </div>

        {footerColumns.map((column, index) => (
          <div key={column.title} data-reveal="bottom" data-delay={String(index * 0.05)}>
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--rp-gold)]">
              {column.title}
            </h3>
            <ul className="mt-5 space-y-4">
              {column.links.map((link) => (
                <li key={link}>
                  <a
                    href="#home"
                    className="text-sm text-[var(--rp-muted)] transition hover:text-[var(--rp-gold)]"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        data-reveal="bottom"
        className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-[var(--rp-border)] pt-8 text-sm text-[var(--rp-muted)] sm:flex-row sm:items-center sm:justify-between"
      >
        <p>(c) 2025 RoulettePay. All rights reserved.</p>
        <p className="flex items-center gap-2">
          Built on Arbitrum One
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  useScrollReveal();

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--rp-bg)] text-[var(--rp-text)]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(246,200,95,0.13),transparent_34%),radial-gradient(circle_at_15%_38%,rgba(14,165,233,0.1),transparent_28%),var(--rp-bg)]" />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <WhyChoose />
      <MoreReasons />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
