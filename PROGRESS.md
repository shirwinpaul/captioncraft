# CaptionCraft build progress

Spec: [PROJECT_SPEC.md](PROJECT_SPEC.md) (phases are listed in section 12).
After each phase: `npm run typecheck`, `npm run lint`, `npm run build` must pass.

## Phase 1: Setup, config, env, theme, landing page ✅
- Config: `src/config/` (ai, platforms, tones, languages, site)
- Libraries: `src/lib/` (storage, byok, favourites, theme, cn)
- Layout and UI: header, footer, settings dialog (BYOK), button, dialog, toast, icons
- Landing page with an original hero illustration
- `postcss.config.mjs`: workaround for the `#` in the project folder path (Tailwind import resolution)

## Phase 2: Photo upload + step-by-step flow ✅
- `src/lib/image.ts`: validation (JPG/PNG/WebP/HEIC, 15 MB), HEIC → JPEG (heic2any, loaded on demand), resize to 1280px, JPEG 0.8, EXIF rotation
- `src/lib/prefs.ts`: wizard choices saved in localStorage (Zod-validated); the photo and context are never stored
- `src/components/create/`: `PhotoUpload` (drag & drop, picker, camera, preview, Change/Remove, privacy note), `Pickers` (platform, tone 1–3, language), `FineTune` (context ≤150, emoji, length, platform-aware hashtag slider, hashtag styles; hidden for WhatsApp/Snapchat), `CaptionWizard` (animated steps, progress bar, Back/Next, Enter = Next), `CaptionStudio`
- `src/components/ui/`: `Toggle`, `Segmented`
- The Generate button currently shows a "coming next" toast

## Phase 3: AI layer ✅
- `POST /api/generate` (`src/app/api/generate/route.ts`): one route for captions, bios and replies (Zod discriminated union), 4 MB body cap, `maxDuration = 60`, friendly error codes (busy / safety / rate_limited / invalid_key / not_configured / too_large)
- `src/lib/ai/`: `fallback.ts` (provider-agnostic runner: 25s per-attempt timeout, 55s total budget, retry once with the validation error appended, then the next provider; a safety block stops the chain), `gemini.ts`, `groq.ts`, `output.ts` (JSON → Zod → platform rules; repairs on the final try), `generate.ts` (chain: visitor Gemini key → app Gemini key → Groq vision → Groq text "degraded" mode), `mock.ts` (`MOCK_AI=true`, dev only), `errors.ts`
- `src/lib/prompts.ts`: system prompts; user text is JSON-encoded inside `<user_data>` tags (prompt-injection safe); never identify people; honest "trending-style"
- `src/lib/platform-rules.ts`: X-weighted character counting, hashtag normalization and caps, title and limit checks, last-resort enforcement
- `src/lib/rate-limit.ts`: in-memory sliding window per IP (20/h, 60/h with your own key); best-effort on serverless
- Browser: `src/lib/api-client.ts` (sends the BYOK header), `src/hooks/useGeneration.ts`, `GeneratingAnimation`, `ErrorPanel`
- Smoke-tested with `MOCK_AI=true`: Instagram capped at 5 tags even when 30 are requested, X counts emoji as 2, YouTube titles present, friendly 400 responses for bad input

## Phase 4: Results screen ✅
- `src/components/results/ResultCard.tsx`: caption/title, removable hashtag chips (pop animation), live character counter (red when over the platform limit; X-weighted for X), Copy caption / Copy hashtags / Copy all, ⭐ Save (toggle; hashtag edits sync to a saved favourite), 🔄 More like this
- `ResultsList.tsx`: "More like this" adds 3 variations right under their card
- `ResultsHeader.tsx`: server notices and the sticky global action bar
- `CaptionStudio`: photo thumbnail + "AI sees: …", Regenerate all, Change options (back to Step 2, same photo), New photo; confetti on the first success per visit (`src/lib/celebrate.ts`, respects reduced motion); "Copied! ✅" toasts (`src/lib/clipboard.ts` with a fallback)

## Phase 5: Bio + Comment Reply modes ✅
- `CreateStudio`: Captions | Bio | Comment Replies tabs (ARIA tablist, arrow keys, `?mode=` URL; panels stay mounted so nothing is lost on switch)
- `ModeShell`: shared form → loading → results flow (copy, favourite, More like this, Regenerate all, Edit inputs)
- `BioStudio`: platform (with bio limit), about you, 1–3 tones, language, emoji, optional photo
- `ReplyStudio`: pasted comment, Polite / Witty / Grateful / Professional quick row + more tones, language, platform, emoji; abusive comments get calm / no-reply options (prompt + `abusive` flag)
- Smoke-tested against the mock AI (bio on X, Tamil reply)

## Phase 6: Favourites page ✅
- `src/components/favourites/FavouritesView.tsx`: type filter (with counts), platform filter (only platforms that have saved items), copy caption / hashtags / all, delete, "Clear all" behind a confirmation dialog, empty state linking to /create
- Text and labels only; photos are never stored

## Phase 7: Polish + tests ✅
- Vitest (`npm test`, 50 tests in `tests/`): request and AI-output Zod schemas; platform rules (Instagram never > 5 hashtags, X never > 280 including hashtags with emoji weighting, no tags for WhatsApp/Snapchat, YouTube titles); fallback runner with fake providers (429, 5xx, timeout, retry with the error appended, invalid JSON twice, safety stop, BYOK notice, time budget); image helpers (`fitWithin`, validation, `prepareImage` with a mocked canvas); rate limiter
- `scripts/vitest.mjs`: Vite can't load files from a path containing "#", so when it does, tests run from a temp copy of `src` + `tests` with `node_modules` linked (watch mode won't see edits there; re-run `npm test`). Normal paths and CI run Vitest directly
- Bug fixed (found by the tests): `cleanHashtags` let one hashtag through when the cap was 0, so WhatsApp/Snapchat captions could get a tag
- `runWithFallback` `limits` option typed as plain numbers (was locked to the default constants)
- Contrast: light `--fg-subtle` and `--danger` darkened to pass WCAG AA (4.5:1) on every surface they're used on
- Already in place and checked: dark mode toggle, reduced-motion support (MotionConfig + CSS), skip link, focus-visible rings, alt text, keyboard tabs

## Phase 8: README ✅
- `README.md`: features, screenshot placeholders (`public/screenshots/`), tech stack and folders, local setup, scripts, getting free Gemini and Groq keys, environment variables, Vercel deployment steps, rate-limit caveat, maintenance notes (model IDs, platform rules)

## Status
All 8 phases are complete. Remaining before launch: add real screenshots, and click through the app with real Gemini/Groq keys.

## Setup (2026-10-03)
- Created `.env.local` from `.env.example` with placeholder keys (`PASTE_YOUR_..._HERE`) and `MOCK_AI=false`, so the app uses the real AI once keys are pasted in. `.env*` is git-ignored (only `.env.example` is committed).
- Re-checked: typecheck, lint and 50/50 tests pass.
