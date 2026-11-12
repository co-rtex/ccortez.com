# Dual Portfolio 2026 — Implementation Plan
Status: planning branch only; do not modify main or production DNS as part of this planning commit.
Date: November 12, 2026
Existing game repository: https://github.com/co-rtex/ccortez.com
Current primary domain: https://ccortez.com
Target (after cutover): https://ccortez.com = professional portfolio; https://play.ccortez.com = 3D game.

## Product goal
Ship TWO first-class experiences, not a 3D splash screen in front of a résumé.
1. Professional portfolio (primary): exceptionally clear, fast, keyboard-accessible, recruiter-facing software engineer portfolio. Static-first, indexable, mobile-first.
2. Playable 3D portfolio (secondary): preserve the current stylized, colorful exploration world and polish rendering, UX, content, stability, and handoff to the professional site.

## Source audit (verified by reading repository, not runtime-tested)
Current game: Vite 7 / React 19 / TypeScript / React Three Fiber / Drei / Three / Zustand / Vitest / Zod / MDX. GitHub Pages workflow builds main to dist. Existing features: island overworld, terrain and water, fixed camera, WASD/Shift traversal, collision and recovery, fauna, scenic benches, workbenches, recruiter navigator, streamed experience scenes, dev workbench editor, structured manifests, tests. Preserve all existing game systems and their invariants.
Known issues requiring verification: index.html still uses Vite SVG favicon and generic title; latest main commit April 2, 2026; many portfolio entries do not reflect user's current experience and projects; old CONTEXT.md is dated March 5 and describes an earlier reverted state, not authoritative current source.
Never conflate old ccortez-portfolio repository with this game repo.

## Architecture decision
- Keep ccortez.com existing game repo as the maintained 3D application. No destructive rewrite; no move of its src/ tree during this sprint.
- Build a new professional app in a NEW separate repo, tentatively named co-rtex/portfolio-professional. Prefer Next.js App Router + TypeScript + Tailwind for static-generation of case-study pages and SEO. Avoid DB/CMS/auth until needed. Set up deployment previews with Vercel.
- Eventually normalize shared public project metadata into typed JSON/TS and create a repeatable sync process. For this four-day sprint, direct migration of verified content is safer than a new cross-repo publishing system.
- Cross-link from professional navigation/hero to playable game, and from game HUD/exit menu to professional site; avoid loading any Three.js code in professional pages.
- Move custom domain only after two preview deployments pass QA. DNS ownership and provider must be checked, not assumed. Preserve old deployment and a documented rollback path.

## Information architecture — professional
Home (headline, evidence strip, 3 featured projects, featured work, CTA)
Experience (/experience; HCSC, UW–Madison LiDAR research, Phoenix-Aid/AccuraTrials; expand only where verified)
Projects (/projects and /projects/[slug]; QuantLab, TaskForge, TradeGrid; optional additional relevant projects)
About (/about; UW–Madison CS/Data Science/Statistics, story, interests, leadership)
Resume (/resume.pdf downloadable and readable link)
Contact (/contact or footer; verified email, GitHub, LinkedIn)
Optional research page only if it adds original technical detail; avoid empty routes.
No splash screens, gaming controls, forced scrolling, or 3D bundle on professional site.

## Visual direction
Professional: distinctive editorial engineering dashboard—not neon hacker/cyber, not generic SaaS template. Warm light surfaces with ink typography, restrained accent, subtle diagrams, crisp borders, rhythm, purposeful whitespace. Clean responsive typography, concise readable copy. Small purposeful motion with reduced-motion support. Preserve a visual connection to the game through a single tasteful 'Explore the 3D world' CTA/preview rather than transplanting the scene.
3D: retain cute, vibrant, stylized, playful aesthetic; fixed exploration camera is an intentional invariant; add polished onboarding, navigation clarity, quick return to professional site, performance and accessibility fallbacks. No gratuitous shaders or major physics rewrite.

## Verified content policy
Source facts from the user's current résumé, repositories, and documented outcomes. Ask user to approve public-facing metrics and employer-sensitive details. Treat HCSC client data/internal screens as confidential: use anonymized descriptions or sanitized reconstructions only; never put source code/secrets/internal identifiers in public artifacts. Distinguish personal work vs team contributions, and shipped vs in-progress.
Suggested priority examples (confirm against actual source): 
- HCSC: backend automation / C# .NET / SQL Server / operational reliability; sanitized impact.
- UW–Madison LiDAR/AI research: Python processing pipeline and researcher collaboration.
- Phoenix-Aid/AccuraTrials: backend/AI validation and evaluation.
- QuantLab: distributed/orchestrated trading backtesting infrastructure, reliability and testing.
- TaskForge: Go/Postgres/SQS asynchronous task processing.
- TradeGrid: VP Technology and collaborative API/frontend platform leadership.
Do not automatically import stale portfolio claims or hallucinate metrics. Maintain data ownership, outcomes, limitations and links in every case study.

## Case-study data schema
id, slug, title, category, oneLine, period, role, organization, status, context/problem, contribution, architecture/stack, 2-4 technical decisions, measurable evidence (if verified), tradeoffs, testing/validation, results, links (source/demo/artifact), image/diagram and alt text, publication/confidentiality flags.
Case-study detail order: overview → problem → constraints → architecture → implementation decisions → verification/results → lessons → links.
3 strong case studies preferred to 10 shallow cards.

## Four-day timebox & three usage-reset strategy
Day 1 (Nov 12): preservation branch, repo/runtime audit, UX and content inventory, visual system and design tokens, professional Next.js scaffold, home + sitewide shell. Deliver: runnable preview and clear task board.
Day 2 (Nov 13): complete professional portfolio pages, fact-check copy against source, case studies, SEO/metadata, mobile/a11y and smoke tests. Deliver: recruiter-ready preview.
Day 3 (Nov 14): update existing 3D game content, game HUD and cross-link, onboarding, loading/error states and selective rendering optimizations. Preserve interactions; add regression tests. Deliver: stable game preview.
Day 4 (Nov 15): visual QA at multiple screen sizes, end-to-end links, speed/accessibility checks, smoke tests, production deployment of both after approval, domain cutover and rollback verification. Deliver: two polished URLs and concise handoff.
If reset timings differ, assign the three heavyweight Claude sessions to (1) architecture/scaffold, (2) professional completion, (3) game polish/integration; use cheap time between for review, assets and human verification. Reserve the final session budget for blocking bugs/release.

## Acceptance criteria — professional
- In first viewport: name, target role/backend focus, strongest proof, immediate projects/resume/contact actions.
- 3 compelling and truthful project cases; clear experience; clickable résumé; contact; current GitHub/LinkedIn; no dead links or placeholders.
- No WebGL/Three.js import in professional site's production bundle.
- Keyboard and mobile navigation, meaningful focus states, accessible semantics, 200% zoom, prefers-reduced-motion, good contrast; test at widths 375/768/1440.
- Metadata, sitemap, robots, canonical URLs, social preview, meaningful title and icon.
- Aim for Lighthouse >=90 on performance/accessibility/best practices/SEO where applicable; assess actual Core Web Vitals and avoid gaming results.
- Local lint/typecheck/tests/build all pass. No private information.

## Acceptance criteria — game
- Existing movement, collisions, scenic benches, interaction panels, world navigation and current tests remain functional.
- Direct 'Professional Portfolio' route always visible outside editing mode; clear 'How to Play'/controls and 'Explore' entry.
- Experience workbenches show refreshed accurate content; game preserves visual identity.
- Loading/error/low capability/reduced-motion or mobile-lite paths present and usable, with text navigation rather than requiring WebGL.
- Validate frame pacing and memory on representative desktop and mobile devices; avoid unbounded effects and unnecessary assets.
- Production build and regression tests pass; deploy to play subdomain after rollback plan.

## Safe operating instructions for Claude Code
1. Start by reading package.json, actual code, test/config files, README, CONTEXT.md (as historical only), GitHub Actions and content manifests. Run git status, lint, tests and build; document findings.
2. Never work directly on main. Do not push, merge, modify DNS/domain/project settings, publish sensitive material or delete existing assets without explicit user approval.
3. Create implementation stages, priority tasks and acceptance tests. Small scoped commits and PRs; no giant blind refactor.
4. Keep a current progress summary in docs/DUAL_PORTFOLIO_STATUS.md including verified commands, changed files, next tasks and blockers for future sessions/context compaction.
5. Prefer parallel exploration/test audits, but serialize writes to overlapping files, and do not leave headless agents or background jobs running without clear user intent.
6. Distinguish verified from proposed content, explicitly report tests run, and never claim visual verification without a browser/screenshot.
7. Deliver a complete professional site first; polish the game second; release verification last.

## Immediate tasks (in order)
P0: Preserve main; audit current tree/deployment; compile accurate public content inventory and source links.
P0: Create professional repo + Next.js project and design system; implement home, projects index, experience, about, resume, contact.
P0: Implement at least 3 meaningful case studies and verify public copy/links.
P0: Deploy professional preview and audit first viewport/mobile/accessibility.
P1: Refresh 3D experience manifests, visible recruiter HUD, metadata, cross-links and onboarding.
P1: Performance/3D fallback and regression test work.
P0: Release both after approval and document DNS rollback.
P2: Extra 3D vignettes, decorative animations, analytics dashboards, or CMS; do not block release.
