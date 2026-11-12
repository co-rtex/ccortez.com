# Dual Portfolio Sprint (November 12–15, 2026)

## Product decision
Keep **this repository** as the interactive 3D game. Build a **new independent professional portfolio** in a separate repository, with a separate deployment.

Target domains (NOT yet configured):
- `ccortez.com`: professional, fast, recruiter-focused Next.js + TypeScript + Tailwind site on Vercel.
- `game.ccortez.com`: existing Vite + React 19 + React Three Fiber interactive 3D world, still deployed independently through GitHub Pages.

**Do not convert this repository into a Next.js monorepo, rewrite the game, or change `public/CNAME` until the cross-domain cutover is tested and approved.**

## Verified repository snapshot
- GitHub default branch latest visible commit (April 2, 2026): `b8b6e4a6bbde3512e1be37e55b643c1dc312c95c`.
- Existing overworld has recruiter HUD, workbench content manifests, movement/collision, water blocking, benches and scenic mode.
- `public/CNAME` currently contains `ccortez.com`.
- `.github/workflows/deploy-pages.yml` deploys the game from `main`.
- `index.html` still refers to `/vite.svg` and generic `ccortez.com` title.
- `CONTEXT.md` describes an older March baseline; inspect current source/README first and re-run real tests before treating it as authoritative.
- Content manifests require review; do not publish stale project claims without source verification.

## Day-by-day shipping gates
**Nov 12 / Foundation:** read-only baseline of existing game and Mac environment; separate professional repo; homepage, nav, responsive shell, reusable experience/project cards, basic typechecked content model, preview build.

**Nov 13 / Professional depth:** verified current experience/project content; case-study templates showing problem, architecture, engineering choices, reliability/testing and impact; proof links, resume/contact, SEO/social image, keyboard/mobile/browser smoke tests.

**Nov 14 / Game polish:** reproduce and fix bugs before adding features; update workbenches from verified content; refine entry/onboarding, recruiter navigation, back-to-professional link, performance; preserve fixed camera/world gameplay invariants. Run existing lint/tests/build and browser regression tests.

**Nov 15 / Release:** two independently passing builds; real browser/phone accessibility checks; verify safe deployment and redirects; configure game subdomain first; only then migrate apex domain to new site. Record rollback and links.

## Content and design
Professional = friendly polished engineering dashboard + editorial clarity; not overdone cyberpunk/hacker aesthetic. Candidate featured work, subject to verifying current facts and confidentiality: HCSC automation/backend, UW–Madison LiDAR research, Phoenix-AID AI/backend, QuantLab, TradeGrid. Avoid inflated metrics, invented screenshots, confidential employer content and unverifiable links. Game should remain playful and expressive, not redesigned as static brochure.

## Operational safeguards
1. Protect existing main branch, dirty files, user assets, and deployment. Work on feature branches, never force-push/reset/clean/delete without explicit authorization.
2. No Claude/Anthropic attribution in site copy, assets, commit trailers, PR body or session URLs. Project attribution settings live at `.claude/settings.json`; independently verify actual `git log` and PR messages.
3. Prefer **one editing lead**; parallel read-only research may be bounded, but no conflicting parallel agents, uncontrolled loops, background tmux sessions or unmanaged worktrees.
4. Inspect Mac space before installs: `df -h "$HOME"`, targeted `du -sh`, `git worktree list`, active sessions. **Never automatically remove Claude VM bundles, caches, user files or session transcripts.**
5. Commit *cohesive, verified* milestones with green lint/typecheck/test/build results. Don't commit each trivial edit; don't wait for one giant final commit.
6. Update a concise `SPRINT_STATUS.md` documenting completed work, files, actual verification output, blockers, next task; avoid duplicated sprawling reports.
7. Fix bugs via reproduce → hypotheses → minimal change → regression test → revalidation.
8. New professional site should not import Three.js into its main route or block resume/projects behind WebGL.
9. No production domain/DNS changes or irreversible deployment actions until manual release authorization and passing checks.

## Acceptance criteria
- Independent sites with working cross-links.
- Recruiter can access resume and project evidence within two clicks from professional home.
- Professional site usable on mobile, keyboard and reduced-motion.
- Both actual production builds pass, game movement/collisions/streaming regressions remain absent.
- No known broken assets, default Vite branding, stale content, unauthorized credits, or tracked generated bundles.
- Safe rollback available for custom-domain migration.

## Status
Planning branch only: this document and attribution preferences do not modify the live game or DNS. Build and test claims must be supplied by the executing local developer after running them.
