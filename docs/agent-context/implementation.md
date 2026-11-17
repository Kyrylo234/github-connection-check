# SitRep implementation context

This document is durable context for future coding agents. It describes the
current implementation and the reasons that are explicit in repository
guidance or code. It is not a historical changelog.

## Product surface

SitRep is a TanStack Start application with two related experiences:

- The home route (`/`) is a live-news situation room. It loads publisher RSS
  headlines, maps safely located stories onto a client-only 3D globe, and
  displays filters, a briefing panel, a news sidebar, and a recent World
  Tension reading.
- Scenario Lab (`/scenarios`, `/scenarios/:id`) is a fictional, decision-based
  exercise. A completed exercise has a read-only report at
  `/results/:id`.
- The archive route (`/archive?page=N`) reads persisted live publisher stories
  from Supabase.

The root layout is `src/routes/__root.tsx`; file-based routes live in
`src/routes/`. `src/routeTree.gen.ts` is generated and must not be edited by
hand.

## Main code boundaries

### Routes and UI

- `src/routes/index.tsx` composes the World Pulse dashboard. It keeps map
  filters and selected-event state in React, while news filtering, clustering,
  and tension calculations remain in pure modules.
- `src/components/world-pulse/` contains globe controls, event details,
  sidebar, attribution, sentiment, and tension UI.
- `src/components/world-pulse/WorldGlobe.tsx` is loaded with `lazy()` and
  rendered inside TanStack Router's `ClientOnly`. Keep `react-globe.gl` out of
  the SSR import graph.
- The briefing-room image is a non-interactive backdrop. Overlay styling must
  not intercept globe interaction.
- `src/components/scenario-lab/` contains the Scenario Lab player, globe,
  ranking input, report fields, report view, and optional reasoning feedback.
- `src/components/ui/` is the generated/shared shadcn-style component layer;
  prefer existing primitives before adding new ones.

### Provider-independent news model

`src/types/news.ts` defines the stable `NewsArticle` and
`AnalyzedNewsEvent` shapes. UI code should consume these types rather than a
specific feed provider so demo fixtures and live RSS can be swapped without
changing the presentation layer.

Important invariants:

- A story's canonical URL is its stable ID.
- A location describes where the event happened, never the publisher's origin.
- `AnalyzedNewsEvent` records whether the location came from `Gemini AI` or
  `Heuristic fallback`.
- Stories that cannot be safely mapped are excluded from map display, but
  their per-story signals may still contribute to global recent tension.

### Pure news logic

Keep calculation and policy logic independent of React and Three.js:

- `src/lib/news-analysis.ts`: sentiment bands, inclusive minimum-severity
  filtering, hotspot intensity, and the 24-hour recent tension calculation.
- `src/lib/news-classification.ts`: strict AI-result validation, heuristic
  fallback selection, mappable-story selection, story signals, and map-only
  clustering.
- `src/lib/publisher-news.ts`: RSS parsing, text cleanup, canonical URL
  normalization, deduplication, category inference, and explicit locative
  heuristic pinning.
- `src/lib/news-location.ts`: deterministic local gazetteer resolution and
  country/bounds validation for external geocoder responses.
- `src/lib/news-location.server.ts`: server-only local-first resolution with a
  durable external-result cache and explicit fallback errors.

The World Tension reading is deliberately calculated from an unfiltered source
snapshot at an explicit snapshot time. Changing map filters must not change
that reading. Clustering is only for map presentation and must not change the
underlying per-story tension inputs.

### Live publisher news and server boundaries

`src/lib/publisher-news.server.ts` owns feed fetching and cache coordination.
It fetches only the fixed URLs in `PUBLISHER_FEEDS`, deduplicates results, and
limits refreshes to `NEWS_CACHE_MINUTES` (currently two minutes). In local
development without Supabase service credentials, it uses an in-process
snapshot; deployed traffic uses the Supabase lease function.

`src/lib/news-classification.server.ts` owns bounded Gemini classification,
content-hash caching, strict JSON validation, database locking/budget checks,
and durable cooldown/terminal-error behavior. Gemini extracts only an event
place and ISO country code; it never supplies coordinates. The server then
calls `resolveNewsLocationWithFallback`: exact local country/city gazetteer
first, an indefinite Supabase-backed external-result cache second, and an
optional Nominatim-compatible HTTP geocoder last. Successful external
coordinates are intentionally retained until an explicit migration or manual
data change; they do not refresh automatically. External results must have finite
latitude/longitude within geographic bounds, a matching country code, and a
locality-name/display-name match; accepted results receive deterministic
confidence (0.85 for an exact locality match, 0.7 for a display-name match).
If the external fallback is not configured or fails, the result stays
unmapped and the existing heuristic map fallback remains available.

`src/lib/publisher-news.functions.ts` and
`src/lib/publisher-news.query.ts` expose the public server-function/query
boundary used by the home route. The browser receives news data and status,
never service credentials.

`src/lib/gemini.server.ts` is server-only and sends validated evidence to the
Gemini API. `src/lib/supabase-admin.server.ts` creates the privileged Supabase
client and supports both the newer `SUPABASE_SECRET_KEY` and legacy
`SUPABASE_SERVICE_ROLE_KEY`. Never add either key, or `GEMINI_API_KEY`, to a
`VITE_` variable or committed file.

### Archive

`src/lib/news-archive.server.ts` writes mappable live stories in batches and
reads fixed-size archive pages. Archive rows retain source attribution and,
when available, assessment fields (sentiment, severity, location, method,
confidence, and rationale).

Apply database changes in order from `supabase/migrations/`:

1. `20261116000000_sitrep_schema.sql` creates the shared cache, analysis
   cache/budget, refresh and analysis lease functions, and base archive.
2. `20261116000001_archive_assessments.sql` adds nullable assessment and
   location fields plus range constraints.
3. `20261116000002_archive_authors.sql` adds publisher author attribution.
4. `20261116000003_news_location_cache.sql` adds the service-role-only cache
   for validated external geocoder results.
5. `20261116000004_permanent_news_location_cache.sql` makes successful
   external coordinate cache entries permanent and clears prior expiry values.

The migrations target an independent Supabase project. Row-level security is
enabled and privileged writes are performed through the server-only client.
Set `GEOCODER_USER_AGENT` to enable the external fallback; use a descriptive
value that identifies the deployment and provides an operator contact.
`GEOCODER_URL` can override the default Nominatim JSON search endpoint. The
fallback is server-only and is intentionally disabled without a configured
User-Agent so deployments do not make unidentified public geocoder requests.

### Scenario Lab

Scenario definitions are data in `src/data/scenarios.ts` and typed by
`src/types/scenario.ts`. The pure state machine in
`src/lib/scenario-session.ts` controls briefing, timed incident delivery,
reading acknowledgement, decisions, debriefs, report writing, and completion.
Progress is tab-local browser storage; there is no authentication requirement.

Scoring is deterministic and should remain separate from optional AI feedback:

- `src/lib/scenario-scoring.ts` validates the actual decision path and
  calculates the report.
- `src/lib/priority-assessment.ts` grades explicit, scenario-specific
  priority rankings.
- `src/lib/situation-report.ts` grades the authored report using scenario
  criteria and round-trips the existing serialized report format through
  `src/lib/situation-report-draft.ts`.
- Authored decisions contribute 75% of each numeric dimension and priority
  ordering contributes 25%. Writing and AI feedback do not change numeric
  scores.
- `src/lib/reasoning-feedback.functions.ts` is a validated public server
  function. Its Gemini result is optional and must be treated as untrusted
  feedback; failures do not change deterministic scores.

Use the shared `RankingList` (`src/components/scenario-lab/RankingList.tsx`)
for sortable report priorities. It must support pointer and keyboard sensors,
show every option initially, and preserve saved rankings.

## Repository commands

Install dependencies and run the local app:

```bash
bun install
cp .env.example .env
bun run dev
```

Useful checks:

```bash
bun run test
bun run lint
bun run build
```

Focused tests are colocated with pure logic and key UI flows under `src/lib/`,
`src/hooks/`, `src/components/scenario-lab/`, and `src/test/`. Add regression
coverage for behavior changes in the nearest existing test file rather than
testing implementation details.

## Change guidance

- Preserve the provider-independent news types and pure calculation modules.
- Keep server credentials and Supabase writes server-only.
- Add schema changes as new ordered Supabase migrations; do not edit an
  already-applied migration to change production behavior.
- Keep route files in `src/routes/` and preserve `<Outlet />` in the root route.
- Do not move globe imports into SSR code or make the globe a prerequisite for
  the page to render.
- Treat live feed text and Gemini output as untrusted input: validate, bound,
  normalize, and keep explicit fallback behavior.
- When changing filtering, tension, scenario transitions, or scoring, update
  the corresponding pure regression tests.
