## Hosting and secrets

- Host the TanStack Start app independently, with an independent Supabase project for the shared cache and news archive.
- Apply schema changes through `supabase/migrations/`; keep service role and Gemini keys server-only and out of version control.
- Use Gemini API server functions for news analysis and Scenario Lab feedback.

## World Pulse architecture

- Keep `NewsArticle` and `AnalyzedNewsEvent` provider-independent so live news can replace the typed demo fixtures without changing the UI.
- Keep globe rendering lazy and client-only behind `ClientOnly`; `react-globe.gl` must never enter the SSR import graph.
- Keep filtering, hotspot intensity and tension calculations in pure TypeScript modules with regression tests, separate from React and Three.js.
- Keep the collapsible globe filters in a dedicated control component; apply minimum severity inclusively to map events, and calculate global recent tension separately from the unfiltered source with an explicit snapshot time.
- Crossfade the aligned calm/fiery Earth assets using a tested pure tension-to-intensity function; visual changes must not alter the tension calculation.
- Keep the briefing-room image as a non-interactive backdrop behind the transparent globe canvas; room styling must not intercept globe interaction.
- Detect new live hotspots against the unfiltered source snapshot in pure logic; defer camera focus during event reading or pause, and never treat filter changes as arrivals.
- Ignore renderer pointer callbacks originating from HTML hotspots; the renderer defers pointer-up handling and can otherwise undo the hotspot's selection.
- Keep Scenario Lab definitions, deterministic scoring and session transitions in pure TypeScript with regression tests; store progress only in tab-local browser storage and allow optional server-side AI feedback separate from deterministic scores, with no authentication or hiring recommendations.
- Keep guided report fields serialized into the existing report string with a pure round-trip parser; preserve older free-text drafts and exclude authored section labels from grading.
- Keep scenario-specific report options and priority reordering in pure logic; grade explicit complete rankings against scenario-specific pairwise rubrics; numeric dimensions blend authored decisions 75% and ranking 25%, never keyword-writing or AI scores.
- Use the shared dnd-kit ranking list for sortable report inputs, with pointer and keyboard sensors; display every option upfront and preserve saved rankings.
- Derive the final task's read-only action recap from actual decision history, never from authored defaults; keep it out of the candidate's graded response.

- Keep optional reasoning feedback in a validated public server function using Gemini API; treat report text as untrusted evidence, keep keys server-only, and never change scores on AI failure.
- Fetch only fixed publisher RSS URLs in a public server function; coordinate a shared two-minute snapshot with a service-role-only atomic database lease so visitors cannot amplify feed requests.
- Normalize and deduplicate news by canonical URL; heuristic pins require explicit locative country phrases, while hosted locations require exact country-scoped gazetteer matches and at least 0.6 confidence; never use publisher origin or AI-generated coordinates.
- Run hosted news classification automatically for new publisher stories during shared feed refreshes, in bounded batches with strict JSON validation, a URL/content cache and database lease/budget; keep terminal credit/access pauses durable and preserve heuristic results on failure.
- Derive global recent tension from unfiltered per-story signals, including AI-classified stories with unknown locations; cluster only map events so display grouping cannot alter the index.
