# Portfolio 2.0 — quality roadmap

The single source of truth for the quality pass on both sites (started 2026-11-12). Per-repo `SPRINT_STATUS.md`
files keep release records; this file holds priorities, art direction, active work and evidence.

## Repositories and branches

| Site | Repo / local dir | Production | Working branch |
| --- | --- | --- | --- |
| 3D game | `co-rtex/ccortez.com` · `~/Desktop/Projects/ccortez-dual-sprint` | https://game.ccortez.com (Pages from `main`, `5176c5b`) | `game/art-direction-pass` (pushed) |
| Professional | `co-rtex/portfolio-professional` · `~/Desktop/Projects/portfolio-professional` | https://ccortez.com (Vercel from `main`, `b01f4dd`) | `site/visual-identity` (pushed, `b815935`) |

`~/Desktop/Projects/ccortez.com` is the protected original checkout (read-only; 96 dirty paths at `825fe37`).
Nothing merges to either `main` without Christian's approval.

## Art direction — "golden hour island"

- **Light:** late golden hour. Warm, unsaturated key light (`#ffd2a1`, from the sunset side), cool violet-blue
  skylight (`#c3c0f2`) so shadows read blue-violet, never grey-brown. ACES tone mapping, exposure 0.92.
- **Palette:** cream stone `#f1e3c4` / `#dcc59c`, terracotta `#d98a5f`, brass `#d4a24c`, lawn `#9ccc58`→`#6fa94a`,
  turquoise shallows `#5fd2cf` → deep `#2b8fb3`, sky rose `#e99aa6` → periwinkle `#7f93d6`. Category colours
  follow the recruiter guide: experiences orange `#ea8f2b`, projects blue `#5f9cff`.
- **Materials:** matte, faceted (flat-shaded icosahedra/dodecahedra) for nature; smooth lathe forms for built
  stone; brass is the only metal. No photoreal textures; patterns are procedural.
- **Silhouettes:** round broadleaf canopies as the default, cones for coastal conifers; accents (blossom, amber)
  are rare so they read as accents. Verticals (lamps, poles) are few — they cut the horizon.
- **Hierarchy:** fountain + armillary (centre) › bench plinths and pennants (ring) › lamps, beds, signs › nature.
  Content stations must out-read decoration.
- **Composition rules:** spokes pass between benches; trails lead to destinations (lakes, shore); groves with
  open meadows rather than even scatter; nothing tall in front of the sun in the scenic view.
- **Performance budget:** 60 fps on an M-series laptop at 1440×900; vegetation instanced; no post-processing
  until it earns its cost.

## Completed and verified (game branch `game/art-direction-pass`)

| Commit | Change | Evidence |
| --- | --- | --- |
| `150fe6d` | Plaza redesign (paved court + compass, lawns, six spokes, promenade, lamps), armillary fountain, island trails, bench plinths + pennants, light shared bench platform, golden-hour lighting, ocean fades into sky, `?shot`/`?spawn` fixtures, scene performance marks | `.shots/before-*` vs `.shots/v4-*`; 133 tests |
| `fe982cd` | Instanced vegetation (4 species, groves), category-coloured plinths, fewer lamps, smaller armillary, flower beds with colliders, district signs, warmer sky, flattened clouds, spawn faces the fountain | `.shots/v5-*`, `v7-spawn`; 138 tests; independent art review applied |

| `ba93606` | Bench monitors show their screens (screen was buried inside the bezel on every bench) | `.shots/v10-benchclose` |
| `8a7c01d` | Opaque stylized lakes with foam line; trails made visible (were back-face culled); planted flower patches; grassy plaza berm | `.shots/v12-lake`, `v13-*`; 139 tests |
| `59f5391` | North-shore lighthouse at the end of the north trail | `.shots/v14-lake`; 140 tests |
| `c478f26` | Start Here bench moved clear of the fountain; reserved pad = paved court | `.shots/v15-*`; 140 tests |

| `ae00104` | Lower, forward-looking follow camera (sky, ocean, lighthouse and armillary in frame); look-ahead shrinks on portrait screens | `.shots/follow-*`; 141 tests |
| `aed2fff` | Plank docks with lanterns beside each lake's scenic bench | `.shots/dock4-lake`; 142 tests |

| `8cb2e8d` | South trail leads to Moss Heart Pond; trails drape over the rendered terrain triangles (`getTerrainMeshHeight`) and the plaza berm, which had hidden their first metres | `.shots/south3-lake`; 144 tests |
| `be5142e` | Pulsing beacon over the Start Here bench, fading once its panel is opened | `.shots/follow-spawn` |

| `912b09d` | Bench scenes shown from across the plaza (~41 m desktop, ~18 m mobile-lite) with 2 m hysteresis; second independent review's top finding | M3: 60 fps, 600–1,100 draw calls |
| `9a2c4e0` | Shorter amber beacon (no longer stacks with the lighthouse lamp); lighthouse beam halo removed; trail reaches the door | `.shots/follow-spawn`, `lh2-lake` |
| `4cb1872` | Foliage between camera and player dithers out (Bayer stipple) | `.shots/follow-grove`; 148 tests; M3 60 fps |

| `6d9e4fa` | Bench names render at a fixed readable size and fade by distance (full ≤14 m, gone by 24 m); Start Here always labelled above its beacon | `.shots/follow-spawn`, `follow-bench` |
| `1946b5c` | Lint fix: CI had failed on every push from `8a7c01d` to `6d9e4fa` (react-refresh rule); green again from `3375936` | `gh run list` |
| `3375936` | Idle prompt is a one-line controls hint that hides after walking; mobile-lite shows a single banner | `.shots/follow-mobile` |

| `590d17c` | Guide panel 336 px with a one-line intro; no controls hint without WebGL; Start Here badge clear of the phone header | `.shots/hud-1366-first`, `follow-mobile` |
| `16ae247` | `public/robots.txt` (Lighthouse SEO) | Lighthouse a11y 100, best practices 100 (desktop + mobile) |

| `76dfc5d` | Bench props scaled ×1.3; Start Here gets a welcome island-map board (it had no scene) | `.shots/interact-panel` |
| `729dfe4` | Ocean depth map → lagoon shallows and surf line; wider dry/wet sand beach | `.shots/coast2-*`; M3 60 fps |
| `4e19f99` | Warm golden-hour haze band along the horizon (sky + ocean horizon) | `.shots/haze-*` |
| `9f2ad7a` | Footstep dust puffs while walking/running (24-puff instanced pool) | `.shots/dust` |
| `2cd836f` | No black bench props: lifted dark bases, metalness capped in scenes, cool fill light opposite the sun, SSEC racks/platform lightened | `.shots/ssec4-lake` |
| `4d8eecd` | Four game benches aligned with their repositories (finance-ops, FootyMind, Quant Signal Workstation, IntelliSort) per the claims audit | 151 tests |

Checkpoint A (before/after, drag to compare; refreshed at `16ae247`): https://claude.ai/artifact/5VQrS8arZbb5EYhRXqNAxa (private).
Mobile (390×844) and no-WebGL fallbacks re-checked on the branch build: no overflow, portfolio links present, no
page errors.

Measured on the M3 GPU (browser pane, production build, island overview): 60 fps (median frame 16.7 ms, p95
17.7 ms); first scene frame 1.26 s after navigation; geometries 2,508 → 843.

`.shots/` is local only (gitignored). Before images were rendered from the production code with identical
camera fixtures (`?shot=px,py,pz,tx,ty,tz`, `?spawn=x,z`).

## Known issues / next candidates (ranked)

1. Bench dioramas are small relative to their 4.2 m platforms.
2. Real-phone GPU check still pending (phones use the shorter ~18 m scene range).
3. Terrain: plaza retaining wall reads as a brown ramp; shoreline sand band is thin; no grass variation.
4. Onboarding: first-minute flow (How to play → Start Here) and HUD weight on 1366×768.
5. Loading: confirm the boot → scene hand-off on a cold cache; the dev server loses its WebGL context under React
   StrictMode (dev-only; production renders).

## Professional site

`site/visual-identity` (`9251889`, `19c11b6`, `b815935`), done by a dedicated agent and reviewed here:
periwinkle accent and compass mark shared with the game, first viewport with resume + PDF + email and the
LiDAR/HCSC roles, simulator status light and job board, generated project figures (Fig. 01–05) drawn only from
each case study's architecture data, case-study figure heroes, numbered sections, sticky contents, prev/next.
No content facts changed (`src/content` untouched). Reported: lint/tsc clean, vitest 26/26, e2e 44/44 (6 new),
Lighthouse home perf 96–97 (a11y/BP/SEO 100), TaskForge 98/100/100/100. Re-verified here: lint, tsc, vitest.
Preview: https://portfolio-professional-2drvwkwhp-co-rtexs-projects.vercel.app (Vercel preview, behind Vercel
login). `4a02ed2`: `og.png` regenerated in the new look by `npm run og:image` (scripts/export-og-image.mjs); `npm run
check` and e2e 44/44 re-run here after the change. Open: home LCP ~2.7 s on simulated slow 4G (display font).

## Claims audit (2026-11-13)

A read-only audit compared every claim on both sites with the repositories and the source-of-truth file (ledger
kept outside the public repos). Applied: the four game-bench corrections above. Needs Christian's decision:
- QuantLab "18 API endpoints" (both sites): the public repo (`c2a597b`) has 58 FastAPI routes.
- EngineX "151 GoogleTest cases" (both sites): stale; v1.0.0 (`1529090`) has 280 GoogleTest tests / 534 ctest cases.
- QuantLab "4–8 workers, 30 s–10 min jobs": in the source of truth, but the repo defaults to 2 workers and measured 1/2/4.
- Project dates: TaskForge "Feb 2026" (repo starts 2026-08-29), QuantLab "May 2026" (repo from 2026-10-30); FootyMind
  and IntelliSort show 2026 in the game (repos Nov 2025).
- TradeGrid "20+ student developers": GitHub shows 11 contributors.
- FridgeFinder game stack (FastAPI/OpenAI/PostgreSQL/Docker): only a frontend-only repo was found.
- Game-only benches with no source anywhere: Mathnasium, HLR, Wisconsin DNR ("Present" looks stale), Elgin Help Hub,
  LLM Research Agent, Prediction Signal Ingestion.

## Open decisions for Christian

- Merge `game/art-direction-pass` to `main` (deploys game.ccortez.com) once Checkpoint A is reviewed.
- Earlier items still open: preferred email on the site, restoring any removed game metrics, the stale TaskForge
  README line, TTL lowering, deleting the staging Vercel project.
