# Christian Cortez — 3D portfolio island

Open-world portfolio built with `Vite + React + TypeScript + React Three Fiber`. Planned home:
`game.ccortez.com` (see `docs/RELEASE_CUTOVER.md`). The text portfolio and resume live in a separate
repository and deploy to `ccortez.com`; the in-game recruiter guide links to it.

## What Exists Now

- Single-world recruiter-focused overworld with a fixed exploration camera.
- Desktop-first WASD traversal with run, collision, water blocking, recovery, and scenic rest spots.
- Workbench-led districts for published work experience and project content.
- Recruiter-first detail panels that show summary metadata before long-form story content.
- Distance-based scene streaming driven by workbench runtime records, not manifest coordinates.
- Dev-only workbench editor for placement, validation, selection, and layout export.

## Scripts

Examples below use `npm`, but the same package scripts work with other package managers.

- `npm run dev`: run the local Vite dev server.
- `npm run build`: typecheck and build production assets.
- `npm run test`: run Vitest with coverage.
- `npm run lint`: run ESLint.
- `npm run new:experience -- <id> --title "Title" --type experience|project`: scaffold a content package.
- `npm run new:workbench -- <id> --title "Title" --district <district>`: append a draft workbench to the central layout registry.

## Content Contract

Each experience lives in `content/experiences/<id>/`:

- `manifest.json`
- `story.mdx`
- `scene.tsx` (optional)
- `assets/`

Experience manifests are content-focused. They define:

- `id`, `slug`, `title`, `type`
- `uiContentRef`
- `sceneModuleRef` (optional)
- `status` (`draft`, `published`)
- `recruiterCard` for published content

Scene placement, interaction radius, visibility, and streaming are owned by workbench layout records in `content/workbenches/layout.ts`.

Optional scene modules receive runtime placement props from the workbench layer:

- `anchor`
- `rotationY`
- `isNearby`
- `isFocused`

## Workbench Layout System

Workbench layout is the live world model.

- Workbenches are the in-world interaction objects.
- Each workbench can link to one experience package or remain a draft placeholder.
- Placement can be freeform or corridor-relative.
- Interaction radius and scene streaming distance are derived from the workbench definition.
- In dev mode, add `?workbenchEditor=1` or press `Ctrl+Shift+W` to open the layout editor.

## URL Parameters

Public:

- `?bench=<id>` opens a published bench on load, moving the player to it as if picked in the guide. The case
  studies on ccortez.com link here (`taskforge`, `enginex`, `quantlab`, `lidar-phenotyping-research`).

Screenshot and diagnostic fixtures (harmless if left in a URL; ignored when absent):

- `?shot=px,py,pz,tx,ty,tz` fixes the camera at a position looking at a target; `?spawn=x,z` starts the player
  elsewhere.
- `?avatar=yaw[,clip[,time]]` turns the avatar and plays or freezes a clip (`idle`, `walk`, `run`).
- `?tfsim=ticks[,worker@tick]` freezes the TaskForge bench's run at a tick, optionally after crashing a worker.
- `?stats` publishes renderer counters on `window.__sceneStats`; `?perf=a,b` switches systems off for profiling
  (`noshadow`, `noscenes`, `noveg`, `dpr1`, and others in `src/world/perfFlags.ts`).
- `?debugWaterCollision` logs water walkability while moving.

## Flagship Benches

TaskForge, EngineX, QuantLab and the LiDAR research bench each run a small deterministic model of the work in
`src/sim/` (job queue, order book, backtest; the LiDAR pass is time-driven in its scene). The job queue, order book
and backtest files are shared with the professional site (`src/lib/sim/` there) and must stay identical;
`npm run check:shared-sim` compares them with a sibling `../portfolio-professional` checkout. Each
panel labels its model as a toy, not the real code, and runs it on a fallback clock when no 3D scene is driving it.

## Current Product Scope

This stabilization baseline is intentionally recruiter-first.

- Published districts: `work-experience`, `projects`
- Draft-only future districts: `personal-life`, `clubs`, `extracurriculars`
- Mobile remains a fallback browsing mode, not a full traversal target

## Recommended Workflow

1. Create or tune a draft workbench in `content/workbenches/layout.ts` or via `new:workbench`.
2. Refine placement in the dev workbench editor.
3. Create or update the linked experience package in `content/experiences/<id>/`.
4. Add recruiter metadata before publishing recruiter-facing content.
5. Run lint, tests, and a production build before continuing with new features.
