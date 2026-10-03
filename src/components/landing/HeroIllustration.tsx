import { HeartIcon, MessageIcon, SparklesIcon } from "@/components/icons/Icons";

/** Original sunset-over-misty-hills scene used inside the phone mockup. */
function SunsetScene() {
  return (
    <svg viewBox="0 0 240 230" className="block h-auto w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="0.42" stopColor="#db2777" />
          <stop offset="0.78" stopColor="#fb923c" />
          <stop offset="1" stopColor="#fed7aa" />
        </linearGradient>
        <radialGradient id="hero-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset="1" stopColor="#fdba74" />
        </radialGradient>
      </defs>
      <rect width="240" height="230" fill="url(#hero-sky)" />
      <circle cx="152" cy="128" r="34" fill="url(#hero-sun)" />
      <path d="M0 150 Q40 112 82 140 T164 128 T240 140 V230 H0Z" fill="#a21caf" opacity="0.55" />
      <path d="M0 172 Q52 140 104 166 T204 158 T240 164 V230 H0Z" fill="#6d28d9" opacity="0.85" />
      <path d="M0 198 Q62 174 124 192 T240 188 V230 H0Z" fill="#2e1065" />
      {/* tea-garden rows */}
      <path d="M10 214 q40 -10 80 -2 M110 210 q50 -12 110 -4" stroke="#7c3aed" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* birds */}
      <g stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M52 62 q6 -6 12 0 q6 -6 12 0" />
        <path d="M92 46 q4 -4 8 0 q4 -4 8 0" />
        <path d="M70 84 q3 -3 6 0 q3 -3 6 0" />
      </g>
    </svg>
  );
}

export function HeroIllustration() {
  return (
    <div
      role="img"
      aria-label="A phone showing a sunset photo with an AI-written caption, hashtags and tone chips floating around it"
      className="relative mx-auto w-full max-w-[360px] select-none py-6"
    >
      <div className="absolute inset-10 -z-10 rounded-[3rem] bg-brand-gradient opacity-40 blur-3xl" />

      {/* Phone */}
      <div className="relative mx-auto w-[236px] rounded-[2.6rem] bg-[#16131f] p-2.5 shadow-2xl ring-1 ring-white/10 sm:w-[260px]">
        <div className="overflow-hidden rounded-[2.1rem] bg-surface">
          <div className="flex items-center gap-2 px-4 pb-2.5 pt-4">
            <span className="size-7 rounded-full bg-brand-gradient" />
            <span className="space-y-1">
              <span className="block h-2 w-20 rounded-full bg-fg/15" />
              <span className="block h-1.5 w-12 rounded-full bg-fg/10" />
            </span>
          </div>
          <SunsetScene />
          <div className="flex gap-3 px-4 pt-3 text-fg-muted">
            <HeartIcon size={18} className="fill-pink-500 text-pink-500" />
            <MessageIcon size={18} />
          </div>
          <div className="px-4 pb-5 pt-2">
            <p className="text-[13px] font-semibold leading-snug text-fg">Golden hour, zero plans, full heart 🌅</p>
            <p className="mt-1.5 text-[12px] font-semibold text-brand">#GoldenHour #SlowEvenings #HillStation</p>
          </div>
        </div>
      </div>

      {/* Floating chips */}
      <div className="glass absolute left-0 top-12 animate-float rounded-2xl px-3 py-2 text-xs font-semibold shadow-soft sm:-left-6">
        😌 Chill + ✨ Aesthetic
      </div>
      <div className="glass absolute right-0 top-40 animate-float-slow rounded-2xl px-3 py-2 text-xs font-semibold shadow-soft [animation-delay:-3s] sm:-right-8">
        English · <span lang="ta">தமிழ்</span> · Tanglish · <span lang="hi">हिन्दी</span>
      </div>
      <div className="absolute bottom-44 left-1 animate-float rounded-full bg-fg px-3.5 py-2 text-xs font-semibold text-bg shadow-lg [animation-delay:-1.5s] sm:-left-4">
        Copied! ✅
      </div>
      <div className="glass absolute -bottom-1 right-0 animate-float-slow rounded-2xl px-3 py-2 shadow-soft [animation-delay:-5s] sm:-right-6">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted">AI sees</span>
        <span className="block text-xs font-semibold">Sunset over misty hills 🌄</span>
      </div>
      <SparklesIcon size={30} className="absolute right-10 top-0 animate-float text-pink-500 [animation-delay:-2s]" />
      <SparklesIcon size={20} className="absolute bottom-20 left-8 animate-float-slow text-violet-500" />
    </div>
  );
}
