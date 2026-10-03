import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  CopyIcon,
  GlobeIcon,
  LayersIcon,
  MessageIcon,
  ShieldIcon,
  SmileIcon,
  UploadIcon,
  UserIcon,
} from "@/components/icons/Icons";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { ButtonLink } from "@/components/ui/Button";
import { LANGUAGE_LIST } from "@/config/languages";
import { PLATFORM_LIST } from "@/config/platforms";
import { CAPTION_TONES } from "@/config/tones";

const STEPS = [
  {
    icon: <UploadIcon size={22} />,
    title: "Upload a photo",
    body: "JPG, PNG, WebP or iPhone HEIC. It's resized right in your browser before anything is sent.",
  },
  {
    icon: <SmileIcon size={22} />,
    title: "Pick your vibe",
    body: "Choose the platform, blend up to 3 tones, pick a language and add optional context.",
  },
  {
    icon: <CopyIcon size={22} />,
    title: "Copy & post",
    body: "Get 5 captions with hashtags that follow the platform's rules. Tweak, copy, save favourites.",
  },
];

const SAMPLE_TONES = ["funny", "aesthetic", "savage", "nostalgic", "adventurous", "poetic", "chill", "festive"];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16 lg:gap-16">
        <div className="text-center md:text-left">
          <p className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-fg-muted shadow-soft md:mx-0">
            <span className="size-2 rounded-full bg-emerald-500" /> Free · No sign-up · 4 languages
          </p>
          <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            Your photo deserves the <span className="text-gradient">perfect caption</span> ✨
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-fg-muted text-pretty md:mx-0">
            Upload a photo, pick your platform, vibe and language. Get captions and hashtags that match what&apos;s
            actually in your photo, ready to copy in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
            <ButtonLink href="/create" size="xl" className="w-full sm:w-auto">
              Try it now <ArrowRightIcon size={20} />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" size="xl" className="w-full sm:w-auto">
              How it works
            </ButtonLink>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-fg-muted md:justify-start">
            <ShieldIcon size={16} className="text-success" /> Photos are never saved. No account needed.
          </p>
        </div>
        <HeroIllustration />
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
        <h2 id="how-heading" className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 text-center text-fg-muted">Three steps. About thirty seconds.</p>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="glass relative rounded-3xl p-6 shadow-soft">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-fg/[0.06]" aria-hidden="true">
                {index + 1}
              </span>
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                {step.icon}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 id="features-heading" className="sr-only">
          Features
        </h2>
        <div className="grid gap-4 md:grid-cols-6">
          <FeatureCard
            className="md:col-span-4"
            icon={<LayersIcon size={20} />}
            title="Knows each platform's rules"
            body="Instagram's 5-hashtag cap, X's 280 characters, YouTube titles, Pinterest SEO. Captions are shaped for where you post."
          >
            <div className="mt-5 flex flex-wrap gap-2">
              {PLATFORM_LIST.map((p) => (
                <span key={p.id} title={p.name}>
                  <PlatformIcon id={p.id} size="sm" />
                  <span className="sr-only">{p.name}</span>
                </span>
              ))}
            </div>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-2"
            icon={<GlobeIcon size={20} />}
            title="Speaks your language"
            body="Native scripts and the way people really text."
          >
            <ul className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              {LANGUAGE_LIST.map((l) => (
                <li key={l.id} lang={l.htmlLang} className="rounded-full bg-surface-2 px-3 py-1">
                  {l.id === "tanglish" ? "Tanglish" : l.native}
                </li>
              ))}
            </ul>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-3"
            icon={<SmileIcon size={20} />}
            title="20 tones. Blend up to 3."
            body="Funny + Chill? Aesthetic + Poetic? Mix moods and get five fresh angles every time."
          >
            <ul className="mt-4 flex flex-wrap gap-2">
              {CAPTION_TONES.filter((t) => SAMPLE_TONES.includes(t.id)).map((t) => (
                <li key={t.id} className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium">
                  {t.emoji} {t.label}
                </li>
              ))}
            </ul>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-3"
            icon={<UserIcon size={20} />}
            title="Bios & comment replies too"
            body="Write profile bios that fit each platform's limit, and kind, witty or professional replies to comments."
          >
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/create?mode=bio" className="inline-flex items-center gap-1.5 text-brand hover:underline">
                <UserIcon size={16} /> Bio generator
              </Link>
              <Link href="/create?mode=replies" className="inline-flex items-center gap-1.5 text-brand hover:underline">
                <MessageIcon size={16} /> Reply generator
              </Link>
            </div>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-6"
            icon={<ShieldIcon size={20} />}
            title="Private by design"
            body="Your photo is processed in memory to write captions and then discarded. No accounts, no database. Favourites and settings stay in your own browser."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient px-6 py-12 text-center text-white shadow-glow sm:px-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Ready to caption your next post?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white">It&apos;s free, and your photo is never saved.</p>
          <ButtonLink
            href="/create"
            variant="secondary"
            size="xl"
            className="mt-7 border-white/30 bg-white text-violet-800 hover:bg-white/90"
          >
            Try it now <ArrowRightIcon size={20} />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  children,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-3xl p-6 shadow-soft ${className}`}>
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">{icon}</span>
      <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-fg-muted">{body}</p>
      {children}
    </div>
  );
}
