# Project Context (`ccortez.com`)

Last updated: March 5, 2026 (local workspace snapshot after user revert)

## 1) What This Project Is
`ccortez.com` is a stylized open-world portfolio website (desktop-first) built as a game-like 3D environment.
The backbone world exists first, then experiences are added one by one as self-contained modules.

Product direction from user:
- Vibrant, cute, fluffy, fun stylized look (not photorealism).
- Backbone/world stability is priority over heavy visual experiments.
- One graphics profile only (no runtime graphics settings UI).
- Fixed exploration camera is intentional.

## 2) Current Snapshot (Important)
This repo is currently on an older reverted baseline relative to recent sky-debug iterations.

What is present now:
- Deterministic terrain + lakes + island boundaries.
- WASD movement + Shift run + tree/rock collisions + water blocking + safe-point recovery.
- One-bench-per-lake scenic rest spots with seated mode and first-person scenic camera.
- Ambient systems: bunnies, birds, per-lake ducks or fish-jump.
- Collision feedback overlay (water vs obstacle) with cooldown behavior.
- Experience manifest/content/streaming backbone.

What is NOT currently present in this reverted state:
- The later sky debug HUD/toggle system discussed in previous chat iterations.
- Shader-only sun-disk rewrite experiments from later iterations.

Current quality gates (verified in this workspace):
- `pnpm lint` passes.
- `pnpm test` passes (45 tests, 12 files).
- `pnpm build` passes.

## 3) Stack + Tooling
- Vite
- React 19 + TypeScript
- React Three Fiber (`@react-three/fiber`, `three`, `@react-three/drei`)
- Zustand
- Vitest + ESLint
- Optional postprocessing package installed (`@react-three/postprocessing`) but not currently mounted in the scene.

Scripts:
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm new:experience <id> --title "Title" --type experience|project`

## 4) High-Level Runtime Architecture
- `src/main.tsx` -> app entry.
- `src/app/App.tsx` -> bootstrap registry, global key handling (`E`, `Esc`), HUD/panel/overlay mounting.
- `src/scenes/OverworldScene.tsx` -> R3F `<Canvas>` setup and world systems composition.

Core world systems:
- `src/world/WorldEnvironment.tsx`: terrain mesh, sky dome, sun spheres, ocean/lakes, props, ambient fauna, clouds, lighting.
- `src/world/PlayerController.tsx`: keyboard movement, run/walk speed, obstacle collision, walkability checks, recovery, seated pose transitions, collision feedback emit.
- `src/world/CameraRig.tsx`: fixed follow camera for exploring + first-person scenic seated camera.
- `src/world/ExperienceDirector.tsx`: proximity + load/unload orchestration.
- `src/world/RestSpotDirector.tsx`: nearest scenic bench prompt routing.
- `src/world/LandmarkProxy.tsx`: in-world experience anchors.
- `src/world/LoadedExperienceScenes.tsx`: mounts streamed scene modules.

State:
- `src/state/gameStore.ts` Zustand store for player position, mode, nearby ids, panel id, loaded scenes, collision feedback events.

## 5) World Rules / Invariants
Gameplay invariants:
- Exploration camera is fixed angled follow camera.
- Player movement is desktop-first keyboard traversal.
- Trees and rocks are hard blockers.
- Water is non-walkable.
- Safe-point recovery applies if player enters invalid position.
- Seated mode disables normal traversal and uses rest-spot camera.

Collision model:
- Trees use trunk-only circle colliders (not canopy extents).
- Rocks use simplified core circle colliders (not full mesh silhouette).

Water/walkability model:
- Authoritative logic is in `terrain.ts`.
- `getWalkabilityBlockReason(...)` returns `water | island-boundary | ocean-depth | none`.
- `isPointWaterBlocked(...)` supports shoreline-touch behavior via epsilon.

## 6) Key Files and Responsibilities
### Terrain + Water
- `src/world/constants.ts`
  - `WORLD_BOUNDS`, `WORLD_WATER_BODIES`, `PLAYER_START`.
  - Guard ensures configured lakes do not overlap at startup.
- `src/world/terrain.ts`
  - Island falloff, lake shape generation, water surface heights, shoreline signed distance.
  - Authoritative functions: `getTerrainHeight`, `isPointWalkable`, `isPointWaterBlocked`, `findNearestWalkablePoint`.

### Scatter + Obstacle Generation
- `src/world/biome.ts`
  - Deterministic scatter placement (trees, bushes, flowers, boulders, coastal rocks).
  - Road path network constants.
  - Collision radii constants:
    - `TREE_TRUNK_RADIUS`, `TREE_COLLIDER_BUFFER`, `TREE_COLLIDER_RADIUS`.
    - `ROCK_CORE_COLLIDER_SCALE`, `ROCK_COLLIDER_BUFFER`.
  - Builds `WORLD_COLLISION_OBSTACLES`.

### Movement + Recovery + Feedback
- `src/world/PlayerController.tsx`
  - Keyboard input map (`WASD`, arrows, Shift run).
  - Speed control via `src/engine/playerSpeed.ts`.
  - Movement resolution via `src/engine/movement.ts`.
  - Walkability block reason routing to feedback reason (`water` vs `obstacle`).
  - Cooldown constants:
    - `COLLISION_FEEDBACK_COOLDOWN_MS = 620`
    - `BLOCKED_MOVEMENT_RATIO_THRESHOLD = 0.42`
  - Debug query support: `?debugWaterCollision`.

### Scenic Rest Spots
- `src/world/scenic.ts`
  - Global scenic orientation constants (`SCENIC_FACING_YAW`, `SCENIC_FORWARD_XZ`, sun distances/heights).
- `src/world/restSpots.ts`
  - One bench per lake generation.
  - Placement validation: walkable, not water, no obstacle overlap, shoreline band checks.
  - Seat and exit anchor computation.
- `src/world/RestSpotDirector.tsx`
  - Proximity detection while exploring.

### Camera
- `src/world/CameraRig.tsx`
  - Exploration: fixed follow offset.
  - Seated: first-person eye height and scenic look vector from global scenic forward direction.

### Ambient Life
- `src/world/ambientLife.ts`
  - Deterministic bunny anchors, bird tracks, per-lake fauna plans.
- `src/world/AmbientCritters.tsx`
  - Bunny wander/hop with forward-facing movement and terrain/water guard.
- `src/world/AmbientBirds.tsx`
  - Looping sky birds with tangent-aligned yaw.
- `src/world/LakeFaunaManager.tsx`
  - Ducks OR fish jump per lake.

### Visuals / Sky / Water Rendering (current reverted implementation)
- `src/world/WorldEnvironment.tsx`
  - Vertex-colored sky dome geometry (`buildSunsetSkyDomeGeometry`) + separate sphere-based sun meshes.
  - `color` background currently set inside scene: `#1d2855`.
  - Fog currently enabled: `#735786`.
  - Stylized lake rendering via shape geometry + seam/bed/surface/highlight layers.
  - Optional runtime validation query support: `?debugWorldValidation`.

### UI Layer
- `src/ui/ExperiencePrompt.tsx`
  - Shows idle/movement prompt, landmark prompt, and seated prompt.
- `src/ui/ExperiencePanel.tsx`
  - Loads MDX story on demand.
- `src/ui/CollisionFeedbackOverlay.tsx`
  - Temporary border/vignette pulse per collision reason; reduced motion aware.

### Experience Content System
- `src/content/schema.ts`
  - Zod validation for manifest contract; ensures `preload < unload`.
- `src/content/loader.ts`
  - `import.meta.glob` for `manifest.json`, `story.mdx`, optional `scene.tsx`.
- `src/content/registry.ts`
  - Registry and published filtering.
- `src/content/runtime.ts`
  - Scene module loading/unloading and panel open bridge.

## 7) Experience Package Contract (Authoritative)
Folder:
- `content/experiences/<id>/manifest.json`
- `content/experiences/<id>/story.mdx`
- `content/experiences/<id>/scene.tsx` (optional)
- `content/experiences/<id>/assets/*`

Manifest fields:
- `id`, `slug`, `title`, `type`
- `worldAnchor`
- `triggerRadius`
- `loadDistances.preload`, `loadDistances.unload`
- `uiContentRef`
- `sceneModuleRef` (optional)
- `status` (`draft` or `published`)

Current content:
- No published workbenches are currently placed in the world.
- `draft-lab`: draft content package, currently not linked to a published workbench.

Workbench layout system:
- In-world placement now lives in `content/workbenches/layout.ts`.
- Workbenches, not experience manifests, own interaction radius and placement.
- Default placement is road-relative (`corridorId`, `distanceAlong`, `lateralOffset`), with freeform fallback for hero pieces.
- The center remains a neutral crossroads; districts branch outward along roads.
- Draft workbenches are visible only in dev editor mode and can be linked to experiences later via `experienceId`.

## 8) Controls + User Flow
- Move: `WASD` / arrow keys.
- Run: hold `Shift`.
- Interact: `E`.
- Exit panel or stand from seat: `Esc`.

Interaction flow:
- Walk near experience landmark -> prompt -> `E` opens panel.
- Walk near scenic bench -> prompt -> `E` enters seated mode.
- Seated -> `E`/`Esc` exits to safe nearby anchor.

## 9) Testing Baseline
Current test files include:
- `src/world/terrain.test.ts` (water/shore/walkability/recovery alignment)
- `src/world/biome.test.ts` (placement validity + collider sizing)
- `src/world/restSpots.test.ts` (one bench per lake + placement/orientation validity)
- `src/world/ambientLife.test.ts` (ambient spawn/fauna plan validity)
- `src/engine/*.test.ts` (movement, interaction, streaming, speed, rest spot helpers)
- `src/content/*.test.ts` (schema + loader behavior)

Latest run in this snapshot:
- 45/45 tests passing.

## 10) Known Active Gaps / Risks (Post-Revert)
- Sky system is still geometry/vertex-color based with separate sun spheres, not shader-authoritative.
- Postprocessing component exists but is not mounted; toggling/consistency tooling for sky debugging is not yet implemented in this reverted baseline.
- Some recent conversation requests were iterative and may not be represented after revert; always verify directly in current code before assuming prior patches exist.

## 11) Debugging Expectations for Future Codex Sessions
User preference is strict debugging-first workflow. For any bug report, respond in this order:
1. Bug Understanding
2. Likely Causes (ranked)
3. Recommended Debugging Solutions (instrumentation + tests)
4. Deterministic Repro Plan
5. Patch Plan (minimal scope)
6. Proposed Code Changes / Test Changes
7. Verification Checklist

Additional expectations:
- Do not jump straight to patching.
- Prefer deterministic repro and engine-level tests when possible.
- Keep diffs minimal and scoped.
- Preserve fixed exploration camera and existing world rules.

## 12) Manual QA Checklist (Quick)
Run `pnpm dev` and verify:
- WASD + Shift run movement is responsive.
- Trees/rocks block correctly (no oversized canopy collision).
- Player cannot enter water; shoreline approach feels natural.
- Collision feedback pulse appears on blocked movement.
- `E` at bench enters seated mode; `E`/`Esc` exits cleanly.
- Seated camera points to scenic direction/sunset.
- Landmark interaction + panel open/close still works.

## 13) Current Default Dev URLs / Debug Query Flags
- Dev server: `http://localhost:5173`
- Optional flags:
  - `?debugWaterCollision` (logs water collision diagnostics from player movement loop)
  - `?debugWorldValidation` (water boundary/hidden water/prop placement console validation)

## 14) Practical Handoff Note
If a new Codex starts from this file, it should:
- First re-open and verify the exact current files before editing (because the user reverts frequently).
- Treat this document as baseline intent + architecture map, not as guaranteed state for every branch/revert.
