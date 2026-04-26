# VirallForge

**Live App:** https://virallforge.vercel.app/

## Big Berlin Hack - Submission

This repository is prepared for **Big Berlin Hack** submission and includes the required technical documentation, setup steps, API references, and submission-ready project details.

## Submission Snapshot

Use this section directly when filling the official submission form.

- **Team Name:** VirallForge
- **All Team Members (Name + Email):** `TODO`
- **What are you building?**
  - VirallForge is an AI-assisted social content engine for generating scroll-stopping campaign assets.
  - It combines research context, template-driven strategy, and multimodal generation (image/video/animation) into one workspace.
- **GitHub Repo (Must be public):** https://github.com/fabienstrauss/big-berlin-hack-2026
- **Demo Video Link (Loom Preferred):** `TODO`
- **Which of the partner technologies have you used? (Counting as technologies to use):**
  - Deepmind (Gemini / Veo)
  - Tavily
  - Gradium (manual voiceover add-on)
- **Which track are you competing in?** Hera – AI Agents for Video Generation
- **Which Side challenge(s) are you competing in?** `TODO`
- **Terms & Conditions:** I agree

## Hackathon Requirements Checklist

- [ ] Project submitted before **Sunday 14:00**
- [ ] Team size is max 5 members
- [ ] At least 3 required partner technologies are used
- [ ] Public GitHub repository included in submission
- [ ] 2-minute video demo link included in submission
- [ ] README includes setup + technical documentation

## Important Links

- Discord: https://discord.gg/d4HJCNF54x
- Project Submission Form: https://forms.techeurope.io/bbh-submission
- Viral Video Content Challenge: https://forms.techeurope.io/bbh/content-challenge
- Venue: https://maps.app.goo.gl/mKxJ5hJ715cDv6Ju5

## Product Overview

VirallForge provides a canvas-based workflow for creating and refining campaign content:

- Build ideas visually in a workspace canvas.
- Choose platform, audience, content type, and template.
- Generate image/video concepts with Gemini (Nano Banana + Veo).
- Generate animation clips with Hera.
- Pull live research snippets and reference images via Tavily.
- Extract and merge workspace context for downstream campaign generation.

## Tech Stack

- Next.js `16.2.4`
- React / React DOM `19.2.4`
- TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/supabase-js`)
- React Flow (`reactflow`)
- Gemini API (image + video generation)
- Hera API (animation generation)
- Tavily API (search + image references)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Required keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Gemini / Veo
GEMINI_API_KEY=

# Hera animation generation
HERA_API_KEY=

# Tavily search
TAVILY_API_KEY=

# Gradium voiceover add-on
GRADIUM_API_KEY=
GRADIUM_VOICE_ID=
```

Runtime behavior when keys are missing:

- `/api/generate`
  - `image` / `video`: returns mock payload when Gemini is missing or generation fails.
  - `animation`: returns mock payload when Hera is missing.
- `/api/search`
  - Returns mock payload when Tavily is missing or request fails.
- `/api/campaign/generate`
  - Returns `503` when Gemini is not configured.
- `/api/campaign/voiceover`
  - Returns `503` when Gradium is not configured.
- Context extraction/packing endpoints depend on Supabase env values.

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

Apply [`supabase/schema.sql`](supabase/schema.sql) to your Supabase project.

It creates required persistence and storage resources, including:

- `public.canvas_state`
- `public.campaign_config`
- `public.workspace_context_artifacts`
- `public.workspace_context_packs`
- `public.generated_content`
- Buckets: `canvas-assets`, `templates`, `generated-content`

## API Routes

- `POST /api/generate`
- `POST /api/search`
- `POST /api/context/extract`
- `POST /api/context/pack`
- `POST /api/campaign/generate`
- `POST /api/campaign/voiceover`
- `DELETE /api/campaign/generate`
- `POST /api/templates/apply`

## Gradium Voiceover Add-On

Manual voiceover generation is available in Step 3 result cards for completed video outputs.

1. Click **Add voiceover** on a video card.
2. Enter or edit narration text.
3. Click **Generate voiceover** to create audio.
4. Preview with the built-in audio player and use **Download** for manual editing workflows.

This is intentionally isolated from the Veo generation path and does not alter video generation behavior.

## Project Structure

- `app/components/workspace/*` — UI for choice flow, canvas, controls
- `app/hooks/*` — board/config state handling
- `app/lib/providers/*` — Gemini, Hera, Tavily, env/provider wiring
- `app/lib/context/*` — extraction, merge, fingerprint, persistence
- `app/lib/campaign/*` — prompt builder + generation orchestration
- `app/api/*` — server route handlers

## Deployment

Production:

- https://virallforge.vercel.app/

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
