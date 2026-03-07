# ccortez.com Backbone

Open-world portfolio backbone built with `Vite + React + TypeScript + React Three Fiber`.

## What Exists Now

- Single-world overworld scene (desktop-first) with fixed angled camera.
- WASD player movement with world bounds and obstacle collision.
- Landmark proxies generated from local manifests.
- Data-driven workbench layout registry with road-based districts.
- Proximity prompt + expandable details panel.
- Streaming manager that preloads/unloads scene modules by distance.
- Local content contracts (`JSON + MDX + optional scene module`).
- CLI scaffolders for new experiences and draft workbenches.

## Scripts

- `pnpm dev`: run local dev server.
- `pnpm build`: typecheck and build.
- `pnpm test`: run unit tests with coverage.
- `pnpm lint`: run ESLint.
- `pnpm new:experience <id> --title "Title" --type experience|project`: scaffold a new experience package.
- `pnpm new:workbench <id> --title "Title" --district <district>`: append a draft workbench placeholder to the central layout registry.

## Experience Package Contract

Each experience lives in `content/experiences/<id>/`:

- `manifest.json`
- `story.mdx`
- `scene.tsx` (optional)
- `assets/`

Manifest fields:

- `id`, `slug`, `title`, `type`
- `worldAnchor`
- `triggerRadius`
- `loadDistances` (`preload`, `unload`)
- `uiContentRef`
- `sceneModuleRef` (optional)
- `status` (`draft`, `published`)

`draft` entries are hidden from the world until promoted to `published`.

## Workbench Layout System

Workbench placement now lives in `content/workbenches/layout.ts`, not inside each experience manifest.

- Workbenches are the in-world interaction objects.
- Each workbench can either link to one experience package or act as a placeholder draft.
- Placement defaults to named road corridors using `distanceAlong + lateralOffset`, with freeform placement available for special cases.
- In dev mode, add `?workbenchEditor=1` or press `Ctrl+Shift+W` to open the layout editor.

## Next Workflow

Backbone is intentionally modular so each future experience can be delivered one at a time:

1. Create or tune a draft workbench in `content/workbenches/layout.ts` or via `pnpm new:workbench`.
2. Position and refine it with the dev workbench editor.
3. Create or update the linked experience package in `content/experiences/<id>/`.
4. Link the workbench by `experienceId` and publish it when ready.
5. Validate with tests, then checkpoint the world.
