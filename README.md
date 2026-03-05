# ccortez.com Backbone

Open-world portfolio backbone built with `Vite + React + TypeScript + React Three Fiber`.

## What Exists Now

- Single-world overworld scene (desktop-first) with fixed angled camera.
- WASD player movement with world bounds and obstacle collision.
- Landmark proxies generated from local manifests.
- Proximity prompt + expandable details panel.
- Streaming manager that preloads/unloads scene modules by distance.
- Local content contracts (`JSON + MDX + optional scene module`).
- CLI scaffolder for new experiences.

## Scripts

- `pnpm dev`: run local dev server.
- `pnpm build`: typecheck and build.
- `pnpm test`: run unit tests with coverage.
- `pnpm lint`: run ESLint.
- `pnpm new:experience <id> --title "Title" --type experience|project`: scaffold a new experience package.

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

## Next Workflow

Backbone is intentionally modular so each future experience can be delivered one at a time:

1. Plan the experience in detail.
2. Implement scene/interactions in `content/experiences/<id>/scene.tsx`.
3. Fill narrative content in `story.mdx`.
4. Place it in the world via `worldAnchor`.
5. Validate with tests, then mark `status: "published"`.
