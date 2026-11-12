# Project Context (`ccortez.com`)

Last updated: March 23, 2026

## 1) What This Project Is
`ccortez.com` is a stylized open-world portfolio site built as a game-like 3D environment.
The current stabilized product target is a recruiter-first MVP:

- Work Experience and Projects are the published districts.
- Personal Life, Clubs, and Extracurriculars remain draft planning space.
- The world stays desktop-first with a fixed exploration camera.
- Stability and architectural clarity matter more than adding new features quickly.

Design direction to preserve:
- Cute, vibrant, stylized, and intentionally game-like.
- Not photorealistic.
- No runtime graphics settings UI.
- Fixed exploration camera is intentional, not temporary.

## 2) Current Product Snapshot
What is present now:
- Deterministic terrain, water, island boundaries, and obstacle placement.
- WASD movement, Shift run, collision blocking, water blocking, and safe-point recovery.
- Scenic rest spots with seated mode and a first-person scenic camera.
- Ambient life systems for birds, critters, and lake fauna.
- Recruiter-first workbench panels with recruiter summary metadata plus long-form story content.
- Dev-only workbench editor for draft creation, manipulation, validation, and layout export.
- Workbench-led scene streaming and interaction.

What is intentionally not expanded in this stabilization phase:
- New districts or feature scope beyond bug fixes, cleanup, and low-risk polish.
- Full mobile traversal parity.
- Postprocessing adoption or new visual systems beyond maintenance.

Current verified quality gates in this workspace:
- `npm run lint`
- `npm test`
- `npm run build`

## 3) Stack + Tooling
- Vite
- React 19 + TypeScript
- React Three Fiber (`@react-three/fiber`, `three`, `@react-three/drei`)
- Zustand
- MDX
- Zod
- Vitest + ESLint

Primary scripts:
- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run new:experience -- <id> --title "Title" --type experience|project`
- `npm run new:workbench -- <id> --title "Title" --district <district>`

## 4) High-Level Runtime Architecture
- `src/main.tsx` boots the React app.
- `src/app/App.tsx` bootstraps experience content, builds workbench runtime records, handles global keyboard interactions, and mounts the scene plus overlays.
- `src/scenes/OverworldScene.tsx` composes the live R3F world systems.

Core runtime systems:
- `src/world/WorldEnvironment.tsx`: terrain, sky, lighting, water, props, and ambient world rendering.
- `src/world/PlayerController.tsx`: movement, collision, recovery, seated transitions, and collision feedback emission.
- `src/world/PlayerCharacterAvatar.tsx`: model-backed player avatar presentation, clip selection, and fallback rendering.
- `src/world/CameraRig.tsx`: fixed exploration camera plus scenic seated camera.
- `src/world/WorkbenchDirector.tsx`: nearest-workbench detection plus workbench-driven scene load/unload decisions.
- `src/world/RestSpotDirector.tsx`: scenic bench proximity management.
- `src/world/LoadedExperienceScenes.tsx`: mounts linked scene modules at workbench-provided anchors.
- `src/ui/WorkbenchPanel.tsx`: recruiter brief and long-form story presentation.
- `src/ui/WorkbenchPrompt.tsx`: idle, workbench, and seated prompt copy.

Global state lives in `src/state/gameStore.ts` and tracks player position, player mode, nearby targets, open panel state, editor focus, loaded scenes, and collision feedback.

## 5) Authoritative Content Model
The live architecture is workbench-led.

Workbenches own:
- in-world placement
- interaction radius
- published vs draft visibility
- experience linkage
- streaming preload/unload behavior
- validation against terrain, obstacles, spacing, and scenic rest spots

Experience packages own:
- identity (`id`, `slug`, `title`, `type`)
- recruiter-facing content metadata
- `story.mdx`
- optional linked scene module
- published vs draft status

Important rule:
- Experience manifests no longer control world placement, trigger radius, or streaming distances.

## 6) Key Files and Responsibilities
### Workbench Layer
- `content/workbenches/layout.ts`
  - Central district registry and workbench definitions.
  - Published recruiter-facing benches live here.
  - Draft placeholders for future districts also live here.
- `src/workbench/runtime.ts`
  - Resolves layout records into runtime-ready workbench records.
  - Validates link integrity, spacing, obstacle overlap, rest-spot overlap, and terrain safety.
- `src/workbench/streaming.ts`
  - Computes load/unload actions from workbench-derived preload and unload distances.
- `src/workbench/editor.ts`
  - Draft creation, duplication, snapping, freeform conversion, and transform behavior.

### Experience Content Layer
- `src/content/schema.ts`
  - Zod validation for the content-focused manifest contract.
- `src/content/loader.ts`
  - `import.meta.glob` loading for manifests, MDX stories, and optional scene modules.
- `src/content/registry.ts`
  - Runtime registry of experience records.
- `src/content/runtime.ts`
  - Scene-module loading cache for linked experience scenes.

### World + Interaction Layer
- `src/world/PlayerController.tsx`
  - Authoritative movement loop, terrain blocking, safe-point behavior, seated transitions, and feedback routing.
- `public/models/player/ccortez-avatar.gltf`
  - Local low-poly player avatar asset with embedded `AvatarIdle`, `AvatarWalk`, and `AvatarRun` clips.
- `src/world/terrain.ts`
  - Authoritative terrain height and walkability logic.
- `src/world/biome.ts`
  - Deterministic prop scatter and obstacle generation.
- `src/world/restSpots.ts`
  - Scenic bench placement, seat anchors, and exit anchors.

## 7) Controls + User Flow
- Move: `WASD` / arrow keys
- Run: hold `Shift`
- Interact: `E`
- Close panel or stand from seat: `Esc`

Interaction flow:
- Walk near a published workbench -> prompt appears -> `E` or click opens the panel.
- Walk near a scenic bench -> `E` enters seated mode.
- While seated -> `E` or `Esc` exits back to exploration.
- In dev mode -> `?workbenchEditor=1` or `Ctrl+Shift+W` opens the editor overlay.

## 8) Testing Baseline
The current suite covers:
- terrain, biome, rest spot, ambient life, and render-space utilities
- player-speed and movement helpers
- content schema and loader behavior
- workbench schema, placement, linking, runtime, streaming, editor, and script helpers
- recruiter-panel rendering behavior
- experience scaffolder output

Current expectations for any stabilization or feature work:
- `npm run lint` must pass
- `npm test` must pass
- `npm run build` must pass

## 9) Known Active Guardrails
- Published linked workbenches should fail loudly if their experience package is missing.
- Workbench runtime is the only supported path for proximity and scene streaming.
- Postprocessing is not active; do not assume unused visual systems are live.
- This file should be treated as the current baseline, but the repo itself is always the final source of truth.

## 10) Manual QA Checklist
Run `npm run dev` and verify:
- Desktop traversal, running, and recovery feel correct.
- Trees, rocks, and water block movement correctly.
- Collision feedback still appears when movement is blocked.
- Scenic rest spots enter and exit cleanly.
- Published workbench prompts appear at the right distance.
- Linked panels open with recruiter summary content first, then story content.
- Draft benches remain editor-only unless explicitly published.

## 11) Practical Handoff Note
If a future Codex session picks this up:
- Re-open the current files before editing because the worktree may already contain local changes.
- Preserve the recruiter-first MVP scope unless the user explicitly expands it.
- Treat workbench layout as the world source of truth and experience manifests as linked content only.
