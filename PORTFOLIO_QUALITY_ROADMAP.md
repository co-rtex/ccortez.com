# Portfolio 2.0 — quality roadmap

The single source of truth for the quality pass on both sites (started 2026-11-12). Per-repo `SPRINT_STATUS.md`
files keep release records; this file holds priorities, art direction, active work and evidence.

## Repositories and branches

| Site | Repo / local dir | Production | Working branch |
| --- | --- | --- | --- |
| 3D game | `co-rtex/ccortez.com` · `~/Desktop/Projects/ccortez-dual-sprint` | https://game.ccortez.com (Pages from `main`, `5176c5b`) | `game/art-direction-pass` (pushed) |
| Professional | `co-rtex/portfolio-professional` · `~/Desktop/Projects/portfolio-professional` | https://ccortez.com (Vercel from `main`, `b01f4dd`) | `site/visual-identity` (pushed, `58342a9`) |

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

| `380be8f` | Ambient birds recoloured as pale gulls (were black specks) | `.shots/birds-sunset` |
| `2f71846` | Phone bench panel opaque above the HUD; touch-aware "Pinch to zoom" hint | `.shots/m-panel` |
| `72f056b` | Third-review fixes: guide folds while a panel is open, prompt hidden then; Start Here panel about Christian (verified wording) without repeated header/district; all-or-nothing bench labels; phone portfolio pill; irregular ocean highlights | `.shots/interact-panel`, `follow-mobile`; 154 tests |
| `ab4d3aa` | Occluding foliage fades by alpha-to-coverage (no stipple) | `.shots/follow-grove`; M3 60 fps, p95 18.6 ms |
| `306b561` | 700 instanced grass tufts in the meadows; empty chip row hidden on Start Here | `.shots/follow-grove2`; 155 tests |
| `36d334c` | Lighthouse door sign linking to the written portfolio | `.shots/sign-lake` |
| `572d82b` | EngineX / QuantLab benches match the evidence (see Claims audit) | 155 tests |
| `5833f40` | Fingerposts where each trail leaves the plaza, naming its destination | `.shots/signs-lake`; 156 tests |
| `0c43cc8` | "Workbench" used consistently for stations; How to play mentions signposts | |
| `04de5af` | 30 Hz shadow updates + adaptive pixel ratio (see Performance) | uncapped spawn p95 33 → 13–16 ms |
| `158e4c1` | Code-review fixes: adaptive DPR falls back to 1x after flip-flops; guide never auto-folds with focus inside and returns focus to its Show button after Hide; panel fold resets when a panel closes | 156 tests; Lighthouse a11y/BP/SEO 100 desktop + mobile |
| `158e4c1` (verified) | Scripted keyboard check: Hide → focus lands on "Show recruiter guide"; Enter reopens; walking with focus inside the guide does not fold it | Playwright, no screenshots |
| `72f3857` | Canopy-fade shader and its test mirror share constants | |
| `db25804` | "Rerun reproducibly" instead of "rerun byte for byte" (claims ledger L8), as on the professional site (`58342a9`) | |
| `c3dbb8f` | Start Here badge just above its board, off the lighthouse | `.shots/follow-spawn` (cropped) |
| `1d4f817` | Dock lanterns stand on posts (cap no longer reads as a floating rock) | `.shots/dock5-lake` |
| `9c68604` | Fourth-review fixes: even per-puff canopy fade, guide folds after the first walk, no District chip, no rotate hint on phones, fingerposts face the plaza, lighthouse window disc removed and sign at the door, matching phone pills, banner auto-hides | `.shots/signs2-lake`, `follow-grove`; 156 tests |
| `94c78d4` | Reduced motion honoured in the 3D world: the inspect camera and scenic seats cut instead of flying, the Start Here beacon, hero props, pennants and fountain armillary hold still | GPU off-screen run: label drift after opening a bench 0 px with `reduce`, large without; 159 tests |
| `a2d0027` | The world canvas is named for screen readers (`role="img"`, points to the recruiter guide); set on the `<canvas>`, not the container, so in-world Html links stay reachable | axe WCAG 2.2 AA: 0 violations |
| `02b5cb0` | Recruiter guide tracks this visit's progress: "N of M opened", "Opened" on each list item, a centre dot and ", opened" on map markers | Production build: opening one bench gives "1 of 19 opened"; axe on the guide: 0 violations; 162 tests |
| `6e9ad15`, `dba89bf` | Start Here moved to the south side of the fountain, facing the spawn point (north of it, the basin and armillary hid it); amber halo replaces the light column that washed the board out; badge just above the board; no pennant. Phone guide: pill and banner step aside when it opens, no repeated title, caret on the toggle | `.shots/v6/now-*` vs `after8-*`, `after2-phone-guide` |
| `274e0d8` | Plaza lawns: broad two-tone patches, sun-dried drifts, smooth clump mottling (faded with distance), mowing rings. Bench dioramas 1.3 → 1.5× | `ring-west` vs `ring-west-scale15`; 60 fps held |
| `786fd48` | Meadows: sun-dried patches, deeper green under groves, fine mottling (baked into vertex colours, no runtime cost). Monitor housings mid slate, so their backs are not black from outside the ring | `edge-before` vs `edge-after1`, `meadow-after1` |
| `428306b` | Island outline blended across the atan2 seam: the 17% radius jump drew a sharp spit due west | `island-top` vs `island-top-after`; continuity test |
| `565aee1` | Bench data ribbons: slim accent line with two travelling packets (still under reduced motion) instead of a pale ghost tube | `inspect-hcsc` vs `inspect-hcsc-after`; 60 fps held |
| `d5cdfc3`, `44cb10d` | Plaza and ring redesign: benches on faceted stone plinths (world-owned; light coping, category-tinted field, accent inlay, front step) instead of 8.4 m flat pale disks; hedge crescents behind each bench (one merged planter mesh + one instanced hedge mesh for all 18, open where paths pass); the kerb becomes a coursed-stone seat wall with coping and gate piers at the six path openings, solid except there. Independent art review applied (hedges sunk and lower, Start Here halo removed, plinths 8% smaller, stronger category tint, matched pier stone, warm-grey monitor housings) | `.shots/v7/base-*` vs `p5-*`, `edge-zoom` vs `edge-zoom-p5`; wall and plinth tests |
| `44cb10d` | Shadow budget: props under 0.22 m never cast; larger props cast only within 20 m of the player (off past 23 m) | Overview, M3 uncapped DPR 2: p95 34.1 -> 17.5 ms, same median; spawn unchanged |
| `448aace` | First minute: a nearby bench's title badge carries "Press E" / "Tap to open" (a second prompt was stacked on it); badges size to their text. Opening a panel focuses its heading; closing returns focus to the opener or its re-rendered guide entry; the closed panel is inert | Scripted walkthrough (`fm-*`); focus checks; axe 0 violations |
| `81c6966`, `ec17a0d` | Player avatar rebuilt as a stylized likeness of Christian (from a private reference photo, not committed): rounded face with a wide grin, warm dark-brown wavy mop with a curly fringe, light-blue polo (collar, placket, sleeve hems), khaki straight-leg trousers, off-white canvas sneakers. Soles now on the ground (the old model floated 0.37 m). Walk and run sampled from gait functions with every pose grounded. 14 meshes, 1 flat-shaded material (was 76 / 16), ~11k triangles. `?avatar=yaw[,clip[,time]]` fixture; `scripts/inspect-player-avatar.mjs` | `.shots/avatar/v4-*` -> `v12-*`; two independent reviews applied; 182 tests; spawn draw calls 652 -> 588 |
| `8f5739e`, `5e93cf7` | Avatar final quality gate: third and fourth independent reviews (final: likeness 6.5, appeal 6, polish 5.5, animation 6; strong at gameplay distance). Swing foot no longer lands early and scrapes; run bounce 17.9 -> 10.3 cm; player-only lighting floor for shade; gait regression test on the exported GLTF | `.shots/avatar-final/contact-sheet.jpg` (local); 185 tests; 60 fps held |

Movement speeds lowered at Christian's request: walk 8.2 -> 2.2 m/s, run 13.4 -> 5.0 m/s. Clip playback now
scales with speed (speed / the clip's measured ground speed, ~1.3x at the defaults), so the planted foot keeps
pace with the ground; the generator measures each clip's ground speed and writes src/world/playerAvatarGaitSpeeds.ts.
Avatar, open item (close-up only): rigid-segment knee/elbow seams when bent,
slipper-like shoes, paddle hands. A skinned mesh (SkinnedMesh with blended weights at knees/elbows, generated by
the same script) is the next step if close-ups matter; Blender would cost 1-3 days for mainly close-up gains.

Tried and reverted: merging static bench props (sibling-level, vertex colours). It cut gameplay-view draw calls
4-13% (590 -> 514 west, 605 -> 580 south) but an interleaved A/B showed no frame-time gain on the M3 under load,
and most remaining calls are glowing or animated props that cannot merge. Next lever if needed: shared materials /
instancing for the repeated glowing props.

Checkpoint A (before/after, drag to compare; refreshed at `36d334c`): https://claude.ai/artifact/5VQrS8arZbb5EYhRXqNAxa (private).
Mobile (390×844) and no-WebGL fallbacks re-checked on the branch build: no overflow, portfolio links present, no
page errors.

Measured on the M3 GPU (browser pane, production build, island overview): 60 fps (median frame 16.7 ms, p95
17.7 ms); first scene frame 1.26 s after navigation; geometries 2,508 → 843.

`.shots/` is local only (gitignored). Before images were rendered from the production code with identical
camera fixtures (`?shot=px,py,pz,tx,ty,tz`, `?spawn=x,z`).

## Flagships, travel and framing (2026-11-13, deep product pass)

Problems found (not on the earlier list):
- The spawn camera faces the north gate, but the ring placed projects after work experience all the way round,
  so TaskForge, EngineX and QuantLab stood at the far south: the one arc the first screen never shows.
- "Featured" was every anchor-tier bench (10 of 19), so it singled nothing out.
- The four benches with case studies were look-alike desks with monitors; nothing showed what the work does.
- Opening a bench from the guide flew only the camera, so closing the panel left the visitor across the island.
- The inspect camera used one world offset, so every south-ring bench was inspected from behind.
- The follow camera never turns, so a south bench sat below the frame while the player stood at it.
- On phones the details panel covered the whole screen; any in-panel demo could not be watched.

Done (each commit verified with lint, types, unit tests, build and GPU screenshots in `.shots/v8/`):
- Ring: work experience runs west from the gate and projects east, each in priority order, TaskForge first
  (`c03bfcb`). Flagships = benches with a case study (TaskForge, EngineX, QuantLab, LiDAR): guide tag "Case study"
  and listed first, panel chip, name badges readable from the spawn point on screens ≥ 900 px.
- Live flagship dioramas, each driven by a small deterministic model that the panel labels as a toy, not the
  real code: TaskForge job queue with crash-a-worker and a recovery trace (`7feae9f`, `a6a7788`); EngineX order
  book with a sequencer gate, journal-first writes, market orders and journal replay (`aeef62b`); LiDAR scan pass
  with point clouds, per-plot traits and a QC flag (`484053a`); QuantLab backtest with immutable dataset versions
  and a manifest that reproduces on re-run (`b24bc33`). Tests cover price-time priority, an uncrossed book,
  replay, reproducibility and no look-ahead. Draw calls at spawn 589 → 516; 60 fps at spawn and at each bench.
- Fast travel: the guide moves the player to the bench's front, inside its interaction radius, facing it
  (`8e2f164`); `?bench=<id>` opens a bench on load (`30f10be`), linked from the case studies on ccortez.com.
- Cameras: inspect offset turns with the bench (`7feae9f`); the follow camera eases toward a bench south of the
  player while in range (`8e2f164`); the view is offset so the bench centres beside or above the panel, which is a
  bottom sheet on phones, and the inspect camera starts 1.5x back on portrait screens (`f3b6c8d`).
- Independent review fixes (`f38e91e`, `5ee0e1f`): panels no longer announce every tick (only the visitor's own
  actions and the crashed job's trace); dead-lettered jobs stack on the bin, not inside it; button names match
  their text; a market order goes to the head of the line; two trace sentences corrected to match the model.
- Accessibility: axe (WCAG 2.2 A/AA) clean at spawn and in the TaskForge and EngineX panels; focus returns to the
  guide's show button when the guide has folded; crash buttons keep focus when they become unavailable.

- Later in the pass: guide minimap rings the flagships and an open bench hides its own badge (`b2a67ec`); Start
  Here points first-time visitors at the four live benches; second review round (`3ddca86`):
  panels run their model on a real-time fallback clock when no scene drives it (no WebGL showed dead buttons),
  EngineX market orders join the back of the sequencer's line (FIFO, as the bench claims) and a full line says
  so, QuantLab honours reduced motion and announces a visitor's run when drawn, LiDAR points sit outside the
  cones; portrait tablets get the bottom sheet and landscape phones a half-width panel (`c55eac0`); the mobile
  banner hides while a panel is open and bench labels shrink on short screens (`9443ca9`); LiDAR panel note
  (`84c4dfa`); QuantLab copy says a re-run matches by construction (`52f1578`).
- Verified end to end (scripted, GPU): first frame 1.84 s at 1366×768; guide → Start Here → Escape (focus back on
  the guide entry) → TaskForge (travel, crash, trace) → close (prompt up at the bench) → walk; no console errors;
  61 fps with a panel open. Uncapped at the north ring the four live benches cost ~0.2 ms a frame (5.6 vs 5.4 ms
  median with bench scenes off).

## Known issues / next candidates (ranked)

1. Bench dioramas: the four flagships are live models. Next: the 14 other benches still share the desk kit;
   the guide minimap does not mark flagships; on phones the guide toggle can overlap a bench badge.
2. Real-phone GPU check still pending (phones use the shorter ~18 m scene range).
3. Terrain: grass variation done; plaza rim is now a seat wall. The reviewer noted meadow hue blotches clash a
   little with the saturated plaza lawn.
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


Pass 2 (`ea6a917`, `1eb292f`, `9e53570`, `8a6cdb0`; reviewed here): numbered figure callouts with a caption key
using each diagram's own names (legible on cards and phones), hero no longer repeats the name, numbered sections,
dated Experience timeline, numbered project index, ruled Tools/Education rows, mono tech stacks, informative
idle simulator log (run settings), inlined stylesheet (home LCP 1.6 → 1.0 s throttled), contents highlight on
case studies. Agent-reported: `npm run check` clean, vitest 26/26, e2e 47 passed + 1 desktop-only skip,
Lighthouse mobile 100/100/100/100 on home and TaskForge. Preview:
https://portfolio-professional-21zb2sfr5-co-rtexs-projects.vercel.app (Vercel login). Trade-off: inlined CSS
grows home HTML 178 → 348 KB raw (~57 KB compressed). `docs/CLAIMS_LEDGER.md` (`c711b57`) holds the audit.

Pass 3 (`b2d8a06` … `aaf0b6a`, reviewed here; from the third independent review): "Recent roles" folded into
Experience (hero rows link to the entries that carry the headline numbers), component names inside home figures
from 768 px with aligned rows, current roles first then by end date, single 56 px phone header with a no-JS menu,
simulator plays 20 ticks on scroll-in (never under reduced motion) and the stray rings are gone, one figure per
case study, footer copy "a bench for each role and project". SSEC's home timeline shows "Supported 15+
researchers." instead of repeating the summary (resume unchanged; `timelineHighlights`). Agent-reported: check
clean, vitest 29/29, Playwright 50 passed + 2 viewport skips, Lighthouse mobile home 99/100/100/100 (LCP 0.8 s),
TaskForge 100s. Preview: https://portfolio-professional-kkw3flklg-co-rtexs-projects.vercel.app (Vercel login).
Open: phone Experience entries are long (stacked numbers); tall TaskForge/QuantLab drawings push facts below the
fold at 1440; edge labels sit close to boxes.

Pass 4 (`e3b6ccb`, `66fc584`, `f6cbfc5`, `e97e374`, `2a8a37f`; agent-reported, spot-checked here): architecture
edge labels clear of boxes (≥ 11 units measured, unit test ≥ 8) with halos; case-study hero drawing capped at 384 px
so title, summary, figure and facts fit the first 1440×900 screen (e2e test for all five); compact metric tables
on narrow columns (LiDAR entry 1363 → 1163 px at 390); equal button heights; resume PDF regenerated. Check clean,
vitest 30/30, Playwright 51 + 3 viewport skips, Lighthouse mobile home 99/100/100/100, TaskForge 100s. `608d21a`:
footer says "workbench" like the game. Preview: https://portfolio-professional-9p0yzgii8-co-rtexs-projects.vercel.app
(Vercel login; a newer one builds from `608d21a`). Open: at 1366×768 the facts sit just below the fold; four-column
drawings have ~10.6 px edge labels at 1024.

Pass 5 (`1f343d6` … `b1825a5`, from the fourth review; spot-checked here, `caseStudies.ts` diff verified as a pure
reorder): TaskForge (public repo, recorded benchmarks) leads, EngineX second; hero buttons "See projects" +
"Resume" with the PDF as a text link; simulator Play/Step in the card header (Play 812 → 179 px at 1366×768);
home timeline drops bullets that repeat a strip number (resume keeps all; unit-tested); phone case-study figure
becomes a vertical list of named steps; resume bullets ≤ 68ch, 20 px/600 headings, muted links (6.5:1); top-aligned
case-study headers; en dashes in dates. Check clean, vitest 39/39, Playwright 57 + 5 viewport skips, Lighthouse
mobile home 99/100/100/100, TaskForge 100s. Preview: https://portfolio-professional-53uu23vbm-co-rtexs-projects.vercel.app
(Vercel login). Open: phone case-study opening is taller with the step list; the resume keeps EngineX first so the
PDF is unchanged in order; PDF page 1 has spare space at the bottom.

## Claims audit (2026-11-13)

A read-only audit compared every claim on both sites with the repositories. Corrections applied where evidence
was decisive (`4d8eecd`, `572d82b` here; `a9ccf81` on the professional site, resume PDF regenerated). The ledger,
open questions and an exposure note are kept in the private professional repository (`docs/CLAIMS_LEDGER.md`).
A short-lived earlier version of this section (commits `21c92a2`, `e68c138`, removed in `a1016ab`) listed claim
discrepancies; it held no employer/research confidential data, contact details or source code, and remains in
this branch's history because purging it needs a force-push.

## Performance investigation (2026-11-13, M3, Chrome/Metal, uncapped: vsync and frame cap off, DPR 2)

`?perf=` switches (`ea06a69`) remove one system at a time. First pass (machine idle):

| Config | Spawn median / p95 ms | Overview median / p95 ms |
| --- | --- | --- |
| current | 11.8 / 13.6 | 18.1 / 34.7 |
| no shadows | 4.9 / 9.1 | 6.6 / 8.8 |
| no bench scenes | 6.5 / 13.1 | 6.6 / 12.7 |
| no vegetation | 12.9 / 31.7 | 17.0 / 34.7 |
| DPR 1 | 8.0 / 10.9 | 12.6 / 14.9 |

Re-measured on an idle machine: shadows remain the dominant cost; a smaller map, a cheaper filter and removing
prop shadow casters did not help, while updating the shadow map every other frame did. Adopted (`perf(shadows)`):
30 Hz shadow updates (static sun) and an adaptive pixel ratio (1.6 → 1 only when a GPU cannot keep up).

| Uncapped, idle machine | Spawn median / p95 ms | Overview median / p95 ms |
| --- | --- | --- |
| per-frame shadows (`?perf=shadowfull`) | 12.6–14.2 / 32.5–33.5 | 18.3–19.1 / 25.3–35.4 |
| 30 Hz shadows (default) | 10.1–10.4 / 13.3–15.7 | 15.3–15.9 / 20.6–33.3 |
| no shadows (reference) | 5.1 / 8.7 | 6.5 / 7.4 |

Re-measured after the flagship pass (2026-11-13, same setup, two runs): spawn median 6.4–7.0 ms, p95 12.3–12.7 ms
(518 draw calls); overview median 11.7–11.8 ms, p95 24.0–26.1 ms (1,026 draw calls). The four flagship dioramas
are instanced and replaced multi-mesh desks; other commits on the branch also changed since the table above, so
this is a measurement of the branch, not of the pass alone.

Remaining: the overview p95 still spikes when the whole bench ring is on screen (~1,160 draw calls then, 1,026 now); merging each
bench scene's static props into a few meshes is the next lever. With vsync on, the M3 holds 60 fps everywhere
measured. All figures are from one Apple M3 in Chrome; no phone GPU has been measured.

## Pending full browser verification (storage-limited session, 2026-11-13)

Free disk was 15–17 GiB, so screenshot batches and new tooling were paused. Not yet verified visually:
- Adaptive DPR fallback on a GPU that cannot hold the frame rate (needs a slower device).
- Real phone GPU performance and touch interaction.

Resolved without installs: both resume PDF pages were rendered with macOS PDFKit (JXA) and inspected. Page 1 had
about a fifth of the page empty because the Phoenix-Aid entry was kept whole; roles may now continue between bullets
in print (professional `eec913f`), so page 1 fills and the PDF stays two pages.
Guide progress styling checked visually (`.shots/v6/now-guide-progress.png`): the pill wraps to its own row at
336 px and the opened markers show their centre dot.

## Open decisions for Christian

- `?bench=` links on ccortez.com case studies only open the bench once this game branch is deployed; until then
  the game ignores the parameter and starts at the spawn point (harmless).

- Merge `game/art-direction-pass` to `main` (deploys game.ccortez.com) once Checkpoint A is reviewed.
- Earlier items still open: preferred email on the site, restoring any removed game metrics, the stale TaskForge
  README line, TTL lowering, deleting the staging Vercel project.
