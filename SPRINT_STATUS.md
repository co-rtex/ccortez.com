# Sprint status — 3D game (target: game.ccortez.com)

**Branch:** `portfolio/dual-site-sprint` (worktree `~/Desktop/Projects/ccortez-dual-sprint`).
**Current milestone:** Nov 14 game polish — complete locally; release (Nov 15) waits on authorization.

## Audit of the original checkout (read-only)
- `~/Desktop/Projects/ccortez.com` (HEAD `825fe37`, 96 dirty paths) was compared file-by-file with this branch.
  All of its uncommitted source and content already exist here (committed as `b96b2e6`…`b8b6e4a`).
- Only meaningful delta: its newer `CONTEXT.md` (Mar 23), adopted in `8e2c9b2`. Untracked `tmp-*.png` and
  `coverage/` there were left alone. The original checkout was not modified.

## Completed and verified
- Lint errors fixed (6 pre-existing): panel helpers moved to `src/ui/workbenchPanelMeta.ts`, explicit `omitSortKeys`.
- Default Vite branding removed: island favicon, real title/description/OG tags, `<noscript>` fallback link.
- Per-frame three.js warning spam fixed (PCFSoftShadowMap deprecation): ~140 warnings in 5 s of movement → 0.
- Content brought in line with verified resume facts (`~/Desktop/Career/Resume Files/CANDIDATE_SOURCE_OF_TRUTH.md`
  and the Nov 9 resumes):
  - New benches: LiDAR Phenotyping Research, HCSC Automation Team, EngineX, TaskForge, QuantLab (with scenes).
  - Corrected: Phoenix-Aid (Software Engineering Intern, Oct 2025–Mar 2026), SSEC (Technical Computing Engineer,
    Nov 2025–May 2026).
  - Removed unverifiable percentages: finance-ops (80%), FridgeFinder (sub-200 ms), HLR (30%), Mathnasium (40%).
- 3D label fonts self-hosted (Manrope woff); no more runtime requests to cdn.jsdelivr.net.
- Recruiter guide links to the text portfolio and resume (`src/app/siteLinks.ts`), on desktop and mobile-lite.
- `docs/RELEASE_CUTOVER.md`: ordered DNS/Pages/Vercel steps with rollback.

## Test results (2026-11-12)
- `npm run lint` — clean
- `npx tsc -b` — clean
- `npm test` — 118/118 (runtime validation covers terrain, obstacle, spacing and link integrity for all 19 benches)
- `npm run build` — passes (three-vendor chunk warning is pre-existing)
- Browser (vite preview, 1440×900 and 390×844): no console errors; WASD movement and camera follow; new bench
  scenes and recruiter briefs render; plaza ring holds 18 perimeter benches; mobile-lite guide shows the link.

## Remaining (prioritized)
1. Christian to review content choices: DNR, HLR and Mathnasium remain (not in the source-of-truth file, so not
   re-verified); restore any removed metric that is accurate.
2. Release per `docs/RELEASE_CUTOVER.md` after explicit approval (merge to `main`, CNAME → `game.ccortez.com`).
3. Optional: `THREE.Clock` deprecation warning (once per load, from @react-three/fiber internals).

## Blockers
- Merging to `main`, pushing, and DNS/Pages changes need authorization.

## Next step
Await release approval; meanwhile polish professional site (Lighthouse pass) locally.
