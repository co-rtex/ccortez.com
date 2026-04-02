# ccortez.com Backbone

Open-world portfolio backbone built with `Vite + React + TypeScript + React Three Fiber`.

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
