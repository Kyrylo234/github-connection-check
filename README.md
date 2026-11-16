
<h1 align="center">SitRep</h1>

<h3 align="center">Global news. On the map.</h3>

<p align="center">
  Explore the latest available headlines from established news publishers on an interactive 3D globe.
  Discover where stories happen, follow the original reporting, and explore AI-assisted event analysis.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-6E9F80?style=flat" alt="Active development">
  <img src="https://img.shields.io/badge/News-RSS_Feeds-496B59?style=flat" alt="RSS news feeds">
  <img src="https://img.shields.io/badge/AI-Gemini-4285F4?style=flat&logo=googlegemini&logoColor=white" alt="Gemini AI">
</p>

## Preview

### Live News Globe

<p align="center">
  <img src="docs/media/globe-demo.gif" alt="SitRep interactive globe showing geolocated news headlines" width="85%">
</p>

Explore global headlines using a 3D globe, map markers, news filters, and links to publisher reports.

### Scenario Lab

<p align="center">
  <img src="docs/media/scenario-lab-demo.png" alt="SitRep interactive Scenario Lab demonstration" width="85%">
</p>

Create and explore decision-based scenarios. **In development.**

## Features

- **Interactive news globe:** Browse headlines by geographic location and open the original publisher coverage.
- **AI-assisted analysis:** Gemini estimates event locations, sentiment, and severity when available, with a labelled heuristic fallback.
- **Shared news feed:** RSS refreshes and classification results are cached in Supabase for reuse across visitors.
- **News archive:** Stores mapped headlines for future exploration.
- **Scenario Lab:** Decision-based simulations and interactive stories *(in development)*.

## Roadmap

<p align="center">
  <img src="docs/media/sitrep-roadmap.svg" alt="SitRep development roadmap: live globe, Scenario Lab, historical archive and historical strategy game" width="95%">
</p>

**Planned:** Historical news exploration by date—including Cold War periods—and Gemini-driven alternate-history strategy scenarios where players make decisions as national leaders. Historical reporting and generated scenarios will be presented separately.

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/-React-61DAFB?style=flat&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/-TanStack_Start-FF4154?style=flat&logo=tanstack&logoColor=white" alt="TanStack Start">
  <img src="https://img.shields.io/badge/-Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/-Gemini-4285F4?style=flat&logo=googlegemini&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/-Vercel-000000?style=flat&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/-Bun-14151A?style=flat&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/-RSS-F26522?style=flat&logo=rss&logoColor=white" alt="RSS">
</p>

## Run Locally

```bash
bun install
cp .env.example .env
bun run dev
```

Add your own server-side credentials to `.env`. This file is ignored by Git. Local development can display RSS headlines without Supabase, but the shared analysis cache and persistent archive require a database.

## Independent Deployment

1. **Create a Supabase project.** Run these migrations in the Supabase SQL Editor, in order:
   - [`20261116000000_sitrep_schema.sql`](supabase/migrations/20261116000000_sitrep_schema.sql)
   - [`20261116000001_archive_assessments.sql`](supabase/migrations/20261116000001_archive_assessments.sql)

   Existing projects with the first migration applied only need the second migration.

2. **Import the repository into Vercel.** Use `bun run build` as the build command.

3. **Configure server environment variables:**

   ```dotenv
   SUPABASE_URL=your_project_url
   SUPABASE_SECRET_KEY=your_sb_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

   Set `SUPABASE_SECRET_KEY` to your project's `sb_secret_…` key. Alternatively, use a legacy service-role key as `SUPABASE_SERVICE_ROLE_KEY`. Supabase publishable keys cannot perform the server-only archive writes. **Never expose secrets with a `VITE_` prefix.**

4. **Deploy.** The first visitor triggers a shared RSS refresh; later visitors reuse the shared feed and cached classifications.

---

<p align="center"><sub>SitRep links to original publisher reporting. Headlines and summaries remain subject to their publishers' terms.</sub></p>
