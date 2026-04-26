# Big Berlin Hack 2026

AI-assisted social content workspace built with Next.js 16, React 19, Supabase, Gemini/Veo, Hera, and Tavily.

## Overview

This project provides a canvas-based workflow for creating and refining campaign content.

- Build ideas visually in a workspace canvas.
- Choose platform, audience, format, and templates.
- Generate image/video concepts with Gemini (Nano Banana + Veo).
- Generate animation clips with Hera.
- Pull research snippets and reference images via Tavily.
- Extract and merge workspace context for downstream campaign generation.

## Stack

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

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy values from `.env.example` into your local env file:

```bash
cp .env.example .env.local
```

Required keys in this repo:

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
```

Runtime behavior when keys are missing:

- `/api/generate`
  - `image` / `video`: falls back to mock payload if Gemini is missing or generation fails.
  - `animation`: falls back to mock payload if Hera is missing.
- `/api/search`
  - Falls back to mock payload if Tavily is missing or request fails.
- `/api/campaign/generate`
  - Returns `503` when Gemini is not configured.
- Context pack/extraction endpoints rely on Supabase config and return server errors when missing.

### 3. Run dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

This app expects the schema in [`supabase/schema.sql`](supabase/schema.sql).

Apply the SQL to your Supabase project before using generation/context persistence features.

The schema provisions (among others):

- `public.canvas_state`
- `public.campaign_config`
- `public.workspace_context_artifacts`
- `public.workspace_context_packs`
- `public.generated_content`
- storage buckets:
  - `canvas-assets`
  - `templates`
  - `generated-content`

## API Routes

### `POST /api/generate`
Generates canvas insertion payloads for `image`, `video`, or `animation` flows.

### `POST /api/search`
Runs Tavily search and returns research/image cards as canvas payloads.

### `POST /api/context/extract`
Extracts context artifacts from workspace nodes.

### `POST /api/context/pack`
Builds a merged workspace context pack from extracted artifacts.

### `POST /api/campaign/generate`
Generates and stores campaign-ready content (image/video) using context pack + choices.

### `DELETE /api/campaign/generate`
Deletes previously generated campaign content assets/records.

### `POST /api/templates/apply`
Applies selected template input and returns template payload.

## Project Shape

Key areas:

- `app/components/workspace/*` UI for choice flow, canvas, and controls.
- `app/hooks/*` canvas and configuration state handling.
- `app/lib/providers/*` integrations for Gemini, Hera, Tavily, OpenAI helper, and env.
- `app/lib/context/*` extraction, fingerprinting, merging, and context-pack persistence.
- `app/lib/campaign/*` prompt building, generation orchestration, and persistence.
- `app/api/*` server routes backing generation/search/context/campaign operations.

## Deployment

Latest production URL:

- https://big-berlin-hack-2026-qn3pt27wx-niranjanxprt-apps.vercel.app

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
