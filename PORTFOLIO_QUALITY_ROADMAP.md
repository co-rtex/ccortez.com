# Portfolio 2.0 — quality roadmap

The single source of truth for the quality pass on both sites (started 2026-11-12). Per-repo `SPRINT_STATUS.md`
files keep release records; this file holds priorities, art direction, active work and evidence.

## Repositories and branches

| Site | Repo / local dir | Production | Working branch |
| --- | --- | --- | --- |
| 3D game | `co-rtex/ccortez.com` · `~/Desktop/Projects/ccortez-dual-sprint` | https://game.ccortez.com (Pages from `main`, `5176c5b`) | `game/art-direction-pass` (pushed) |
| Professional | `co-rtex/portfolio-professional` · `~/Desktop/Projects/portfolio-professional` | https://ccortez.com (Vercel from `main`, `b01f4dd`) | `site/visual-identity` (in progress) |

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

Measured on the M3 GPU (browser pane, production build, island overview): 60 fps (median frame 16.7 ms, p95
17.7 ms); first scene frame 1.26 s after navigation; geometries 2,508 → 843.

`.shots/` is local only (gitignored). Before images were rendered from the production code with identical
camera fixtures (`?shot=px,py,pz,tx,ty,tz`, `?spawn=x,z`).

## Known issues / next candidates (ranked)

1. Bench scenes are small and dark when revealed (palette `base` colours, black monitors); give them light
   materials and emissive screens consistent with the new palette.
2. Nothing to discover beyond the plaza: add destinations at trail ends (north-shore lookout, south pier, lake
   gazebos at the existing scenic benches).
3. The Start Here bench platform overlaps the fountain basin (pre-existing layout: anchor 4.3 m from centre).
4. Terrain: plaza retaining wall reads as a brown ramp; shoreline sand band is thin; no grass variation.
5. Water: lakes still flat-shaded basic material; add gentle shoreline foam and ripples consistent with the ocean.
6. Onboarding: first-minute flow (How to play → Start Here) and HUD weight on 1366×768.
7. Loading: confirm the boot → scene hand-off on a cold cache; the dev server loses its WebGL context under React
   StrictMode (dev-only; production renders).

## Professional site

Visual-identity pass running on `site/visual-identity` (homepage first viewport, generated project visuals,
case-study hierarchy and prev/next navigation). Results and preview URL to be recorded here.

## Open decisions for Christian

- Merge `game/art-direction-pass` to `main` (deploys game.ccortez.com) once Checkpoint A is reviewed.
- Earlier items still open: preferred email on the site, restoring any removed game metrics, the stale TaskForge
  README line, TTL lowering, deleting the staging Vercel project.
