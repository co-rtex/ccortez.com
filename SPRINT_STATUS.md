# Sprint status — 3D game (target: game.ccortez.com)

**Branch:** `portfolio/dual-site-sprint`, pushed; PR https://github.com/co-rtex/ccortez.com/pull/1 (not merged).
**Staging:** https://ccortez-game-preview.vercel.app (same build, `vercel.app` only).
**Current milestone:** game polish complete and verified; release waits on approval (`docs/RELEASE_CUTOVER.md`).

## Repository reconciliation (2026-11-13)
- Remote branch was only the two planning commits because local work had not been pushed (push was not yet
  authorized). Local = remote + all later commits; no uncommitted or untracked work besides ignored `dist/` and
  screenshot output. Pushed as a normal fast-forward.
- `origin/plan/dual-portfolio-2026` holds a planning document only; its requirements are folded in here.
- The original checkout `~/Desktop/Projects/ccortez.com` (local `main` at `825fe37`, 96 dirty paths) was never
  modified. All of its uncommitted source and content were already on this branch; only its newer `CONTEXT.md`
  was adopted.

## Completed and verified
- Content matches verified resume facts: new LiDAR, HCSC, EngineX, TaskForge, QuantLab benches; Phoenix-Aid and SSEC
  corrected; unverifiable percentages removed; EngineX and TaskForge figures carry their benchmark conditions.
- Onboarding: How to play dialog (native `<dialog>`, focus on the primary action, keys do not leak into the game),
  welcome story explains controls, Start Here shows "Center plaza: a one-minute introduction".
- Always-visible "Portfolio & resume" link (desktop; moves beside an open panel); mobile-lite banner and guide link
  to the text portfolio.
- Resilience: WebGL detection and an error boundary around the scene; without WebGL the guide and panels still work
  as a text tour. Static boot screen before JavaScript runs; "Building the island…" while the scene loads.
- Performance: three.js and R3F no longer load before the HUD (scene lazy-loaded; terrain math bit-identical without
  three); fonts self-hosted (cold first paint 2.54 s → 1.73 s on staging); no per-frame shadow warnings; no CDN font
  fetches for 3D labels.
- Accessibility (Lighthouse): mobile 100, desktop 94 → fixed name/label mismatch, 24px marker targets with no
  overlap at 1024–1440px, HUD text ≥ 12px. Remaining desktop note: missing source maps (not an a11y issue).
- Release tooling: `scripts/verify-release.sh` (passes against staging), CI on PRs and sprint branches.

## Test results (2026-11-13)
- `npm run lint` clean · `npx tsc -b` clean · `npx vitest run` 128/128 · `npm run build` passes · CI green on PR #1.
- Scripted browser checks on staging (Chromium, 1440×900 and 390×844): no console errors; WASD movement moves the
  player; How to play opens, focuses "Start exploring", closes on Esc; site bar never overlaps the panel; no-WebGL
  fallback renders and panels open; mobile has no horizontal overflow and a working portfolio link.
- Load marks on staging (Chromium, swiftshader): warm FCP 0.38 s, HUD 0.42 s, canvas 0.72 s; cold FCP 1.73 s,
  canvas 5.2 s. Lighthouse performance stays low (software WebGL in headless Chrome inflates blocking time).

## Decisions for Christian
1. Approve the cutover (`docs/RELEASE_CUTOVER.md`), starting with merging PR #1.
2. Which account manages the `googledomains.com` DNS zone (Squarespace Domains or Google Cloud DNS)?
3. Restore any removed game metrics that are accurate (finance-ops 80%, FridgeFinder sub-200 ms, HLR 30%,
   Mathnasium 40%); DNR, HLR and Mathnasium remain because they are not in the source-of-truth file.
4. Subdomain name: this sprint uses `game.ccortez.com`; the older plan branch said `play.ccortez.com`.

## Blockers
- DNS, Pages domain and merging to `main` need explicit approval.

## Next step
After approval: run the cutover steps in order, then `scripts/verify-release.sh` and the professional e2e suite
against the real domains.
