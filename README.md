# SitRep

SitRep shows live publisher headlines on a globe, estimates event impact with Gemini when available, and includes a Scenario Lab. The app uses TanStack Start and an independent Supabase database for shared news state.

## Independent deployment

1. Create a Supabase project in your own account. Run [the schema migration](supabase/migrations/20261116000000_sitrep_schema.sql), then [the archive assessment migration](supabase/migrations/20261116000001_archive_assessments.sql), in its SQL Editor. These create the shared RSS lease, Gemini analysis cache and budget, and permanent `news_archive` table with per-story assessment fields. Existing projects only need the second migration.
2. Import this repository into Vercel as a new project. Use `bun run build` as the build command. Set `SUPABASE_URL` and the new `SUPABASE_SECRET_KEY` (`sb_secret_…`) from **your new Supabase project** as server environment variables. The legacy `service_role` key also works under `SUPABASE_SERVICE_ROLE_KEY`, but a publishable key cannot write this server-only archive. Set `GEMINI_API_KEY` from Google AI Studio for AI analysis. Do not use a `VITE_` prefix for secrets.
3. Deploy. The first visitor triggers the shared feed refresh. Further visitors share its results. New stories are checked for a supported map location before any headline is saved to the shared snapshot or `news_archive`. Unlocatable headlines are discarded after the refresh; cached classification metadata prevents repeated Gemini calls. The globe still uses the bounded live snapshot. On the first successful refresh after this change, older unlocatable rows in the live archive are removed.

For local work, install dependencies and copy `.env.example` to `.env` with your own server values, then run `bun run dev`. Local development can display RSS without Supabase credentials, but the archive and shared analysis cache require the database. The `.env` file is ignored by Git.

The live archive stores only mappable headlines, short RSS summaries, links, sentiment, severity, resolved location, and analysis provenance, not full publisher articles. The first shared refresh after the assessment migration backfills existing live rows. `collection` separates live stories from future curated historical collections. The archive grows until you choose a retention policy; monitor database size on the Supabase dashboard. Existing stories in an older database do **not** transfer automatically to a new project. Export and import them before retiring the old project if you want to preserve them.

Gemini analyses new stories during shared refreshes, in batches of up to three with a 60-story daily database budget. Results are cached across visitors. Scenario Lab feedback runs on request and never changes deterministic scores. If Gemini is unavailable, news retains a labelled heuristic reading.
