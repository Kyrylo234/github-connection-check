---
name: css-animations
description: Use when adding, tuning or debugging animations, transitions, entrance effects, hover/focus motion, loading shimmers, pulses or glows in this Tailwind v4 + shadcn app (e.g. World Pulse dashboard panels, globe overlays, scenario choices, results reveals).
---
# CSS animations (Tailwind v4 + shadcn)

## Where animations live
- Define every keyframe and timing token once in `src/styles.css`. Never write ad hoc `style={{animation}}` or arbitrary `animate-[...]` in components.
- Register in `@theme inline` so Tailwind generates utilities:
  ```css
  @theme inline {
    --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
    --animate-fade-up: fade-up 0.6s var(--ease-out-soft) both;
    --animate-pulse-glow: pulse-glow 3s ease-in-out infinite;
    --animate-shimmer: shimmer 2s linear infinite;
  }
  @keyframes fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--primary) 0%, transparent); } 50% { box-shadow: 0 0 24px 2px color-mix(in oklab, var(--primary) 35%, transparent); } }
  @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
  ```
  Keyframes go outside `@theme` (top level). Use `animate-fade-up` etc. in JSX.
- Colours in keyframes use design tokens (`var(--primary)`, `color-mix`), never hex.
- `tw-animate-css` is already imported: prefer its `animate-in fade-in slide-in-from-bottom-2 duration-500` and shadcn's `data-[state=open]:animate-in` before writing new keyframes.

## Style for this project (restrained, premium)
- Durations: 150–250ms for hover/focus, 400–700ms for entrances, 2–4s for ambient loops.
- Animate only `opacity` and `transform` (and `filter`/`box-shadow` sparingly). Never animate width/height/top/left.
- Stagger lists with a CSS variable: `style={{ "--i": idx } as React.CSSProperties}` + `animation-delay: calc(var(--i) * 60ms)` defined in a utility (`@utility stagger { animation-delay: calc(var(--i, 0) * 60ms); }`).
- Ambient loops (sentiment pulses, live indicators) are subtle: small scale (≤1.05) and low-opacity glows.
- Sentiment motion uses semantic tokens (positive/neutral/negative), never raw green/blue/red.

## Accessibility (mandatory)
Always include:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
```
Content must be readable without animation (use `both` fill so end state shows).

## SSR / hydration
- Entrance animations run from CSS on mount; do not toggle classes from `useEffect` just to trigger them.
- For scroll-reveal, use `IntersectionObserver` in `useEffect` and add a `data-visible` attribute; style with `data-[visible=true]:animate-fade-up` and start `opacity-0`-safe (only hide after hydration).

## Checklist
1. Is there a tw-animate-css / shadcn built-in? Use it.
2. Otherwise add keyframe + `--animate-*` token in styles.css.
3. Reduced-motion covered. 4. Only transform/opacity. 5. Verify visually with a Playwright screenshot.
