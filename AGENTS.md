<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## World Pulse architecture

- Keep `NewsArticle` and `AnalyzedNewsEvent` provider-independent so live news can replace the typed demo fixtures without changing the UI.
- Keep globe rendering lazy and client-only behind `ClientOnly`; `react-globe.gl` must never enter the SSR import graph.
- Keep filtering, hotspot intensity and tension calculations in pure TypeScript modules with regression tests, separate from React and Three.js.
- Keep the collapsible globe filters in a dedicated control component; apply minimum severity inclusively to map events, and calculate global recent tension separately from the unfiltered source with an explicit snapshot time.
- Crossfade the aligned calm/fiery Earth assets using a tested pure tension-to-intensity function; visual changes must not alter the tension calculation.
- Keep the briefing-room image as a non-interactive backdrop behind the transparent globe canvas; room styling must not intercept globe interaction.
- Detect new live hotspots against the unfiltered source snapshot in pure logic; defer camera focus during event reading or pause, and never treat filter changes as arrivals.
- Ignore renderer pointer callbacks originating from HTML hotspots; the renderer defers pointer-up handling and can otherwise undo the hotspot's selection.
- Keep Scenario Lab definitions, deterministic scoring and session transitions in pure TypeScript with regression tests; store progress only in tab-local browser storage and keep AI, authentication and hiring recommendations out of the exercise.
- Keep guided report fields serialized into the existing report string with a pure round-trip parser; preserve older free-text drafts and exclude authored section labels from grading.
- Keep scenario-specific report options and priority reordering in pure logic; save explicit user selections as report text without changing the fixed grading rubric.
