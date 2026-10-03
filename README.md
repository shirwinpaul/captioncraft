# CaptionCraft ✨

**Your photo deserves the perfect caption.**

CaptionCraft is a free, mobile-first web app. Upload a photo, pick a platform, a vibe and a language, and get five captions with hashtags that match what is actually in the photo. It also writes profile bios and replies to comments.

No sign-up and no database. Photos are never stored.

> 📸 _Screenshot placeholders: add your own images to `public/screenshots/` and update the paths below._
>
> | Landing | Step-by-step flow | Results | Favourites |
> | --- | --- | --- | --- |
> | ![Landing](public/screenshots/landing.png) | ![Flow](public/screenshots/flow.png) | ![Results](public/screenshots/results.png) | ![Favourites](public/screenshots/favourites.png) |

---

## Features

### Captions from your photo
- **Upload** by drag and drop, file picker or phone camera. Accepts JPG, PNG, WebP and iPhone **HEIC** files up to 15 MB.
- **Processed in your browser first.** HEIC photos are converted to JPEG, then every photo is resized to at most 1280 px and compressed before it is sent.
- **Five steps:** photo → platform → tone (blend 1 to 3 of 20 tones) → language → fine-tune. Each step has an animated progress bar. Enter goes to the next step, and your choices are remembered (the photo isn't).
- **Nine platforms:** Instagram, Facebook, X, LinkedIn, Threads, YouTube (title + description), WhatsApp Status, Snapchat and Pinterest (title + description). Each one has its own style guide, character limit and hashtag rules.
- **Four languages:** English, Tamil (Tamil script), Tanglish (casual Tamil in English letters) and Hindi (Devanagari script).
- **Fine-tune:** optional context (up to 150 characters), emoji on or off, caption length, hashtag count (limited to what the platform allows) and hashtag style (popular, niche, trending-style).

### Results
- An **"AI sees: …"** line shows what the AI noticed in your photo.
- Five caption cards. Each has removable hashtag chips and a live character counter that turns red when the caption is over the platform limit (X counts emoji as 2 characters, like X does).
- Buttons for **Copy caption**, **Copy hashtags**, **Copy all**, **⭐ Save** and **🔄 More like this** (three variations of that caption).
- **Regenerate all**, **Change options** (keeps the same photo) and **New photo**.
- Confetti on your first result of each visit.

### Bonus modes
- **Bio Generator:** enter your name, what you do and what you like (a photo is optional) and get five bios within the platform's bio limit.
- **Comment Replies:** paste a comment you received and get five replies. There's a quick Polite / Witty / Grateful / Professional row. The app never writes abusive replies. If the comment itself is abusive, you get calm replies and a suggestion not to reply.

### Favourites
- Saved captions, bios and replies, with filters by type and platform, copy and delete buttons, and **Clear all** (asks first).
- Saved only in your browser (localStorage). Only the text is saved, never the photo.

### Under the hood
- **Free AI with a fallback.** Google Gemini (Flash) is used first. If it fails, Groq's vision model is tried. If no vision model is available, Groq's text model writes captions from your context and the app tells you the photo couldn't be analysed.
- The app moves to the next provider on a 429, a 5xx error, a timeout over 25 seconds, or invalid JSON after one retry. All AI output is checked against **Zod** schemas and the platform rules.
- **Bring your own key:** visitors can paste their own free Gemini key in Settings. It is kept in their browser and sent with each request in a header. It is never logged or stored on the server.
- **Rate limit per IP:** 20 generations per hour, or 60 with your own key.
- **Privacy and safety:** the AI is told never to identify real people. Your context is treated as data, not as instructions, which guards against prompt injection. If the AI provider blocks a photo for safety reasons, you get a polite message asking for a different photo.
- **Accessibility:** light and dark mode, keyboard navigation, visible focus outlines, a skip link, alt text, WCAG AA colour contrast and support for the "reduce motion" setting.

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · Framer Motion · Zod · heic2any · `@google/genai` · `groq-sdk` · Vitest

```
src/
  app/          pages (/, /create, /favourites) and the /api/generate route
  components/   UI, organized by feature (create, results, favourites, layout, ui, icons)
  config/       ai.ts (ALL model IDs), platforms.ts (platform rules), tones, languages, site
  hooks/        useGeneration, useStore
  lib/          ai/ (providers, fallback, output parsing), prompts, schemas, image, platform rules, rate limit
  types/
tests/          Vitest unit tests
```

---

## Run it locally

You need **Node.js 20.9 or newer**.

```bash
npm install
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
# put your keys in .env.local (see below)
npm run dev
```

Open http://localhost:3000.

**No keys yet?** Add `MOCK_AI=true` to `.env.local` to get sample output without calling any AI. This only works in development.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (strict) |
| `npm test` | Vitest unit tests (`npm run test:watch` re-runs them as you edit) |

> If your project folder's path contains a `#`, Vite can't load files from it. `npm test` handles this by running the tests from a temporary copy, but watch mode won't pick up your edits in that case. Renaming the folder avoids the problem.

---

## Getting free API keys

### Google Gemini (primary)
1. Go to **[Google AI Studio](https://aistudio.google.com/apikey)** and sign in with a Google account.
2. Click **Create API key** and copy it.
3. Put it in `GEMINI_API_KEY`.

The free tier has per-minute and per-day limits. See [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing). Visitors can also paste their own key in the app's Settings, so their usage counts against their own quota.

### Groq (fallback)
1. Go to the **[Groq Console](https://console.groq.com/keys)** and sign up.
2. Click **Create API Key** and copy it.
3. Put it in `GROQ_API_KEY`.

The app still works with only one of the two keys, but it's more reliable with both.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Recommended | Google Gemini key (primary provider) |
| `GROQ_API_KEY` | Recommended | Groq key (fallback provider) |
| `RATE_LIMIT_PER_HOUR` | No | Generations per IP per hour (default `20`) |
| `MOCK_AI` | No | `true` returns sample output in development. Ignored in production |

The keys are read **only on the server**. Never prefix them with `NEXT_PUBLIC_`. `.env.local` is in `.gitignore`.

---

## Deploy to Vercel (free tier)

1. Push the project to a GitHub, GitLab or Bitbucket repository. Make sure `.env.local` is **not** committed (`.gitignore` already excludes it).
2. Go to **[vercel.com/new](https://vercel.com/new)** and import the repository. Vercel detects Next.js, so you can keep the default build settings.
3. Under **Environment Variables**, add `GEMINI_API_KEY` and `GROQ_API_KEY` (and optionally `RATE_LIMIT_PER_HOUR`). Don't add `MOCK_AI`.
4. Click **Deploy**. Later pushes to your main branch deploy automatically.

Notes:
- The AI route sets `maxDuration = 60` seconds. A whole request, including fallbacks, has a 55-second limit.
- Photos are compressed in the browser to about 1.5 MB, which keeps requests well under Vercel's 4.5 MB limit.
- **The rate limit is best-effort.** It is stored in memory, and on serverless each function instance has its own memory, so a determined user can get past it. It still stops accidental loops and casual abuse. For a strict limit, replace the in-memory map in `src/lib/rate-limit.ts` with a shared store such as Upstash Redis.

## Maintenance

- **Model IDs** are all in `src/config/ai.ts`, with links to the provider docs. Providers retire models regularly. If you see 404 or "model not found" errors in the logs, update the IDs there.
- **Platform rules** (character limits, hashtag maximums, bio limits) are in `src/config/platforms.ts`. Platforms change these, so check them now and then.

## Privacy

Your photo is sent to a free AI provider only to generate captions and is not saved by this app. Favourites, preferences and your optional API key stay in your browser.

---

Built by **Anand Raj**.
