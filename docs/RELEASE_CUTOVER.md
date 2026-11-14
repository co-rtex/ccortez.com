# Release and domain cutover runbook

> **Completed 2026-11-12.** `ccortez.com` → Vercel (professional site), `game.ccortez.com` → GitHub Pages (game).
> Evidence is in `SPRINT_STATUS.md`. The rollback section below still applies.

Goal: `ccortez.com` serves the professional portfolio (Vercel); `game.ccortez.com` serves this 3D game
(GitHub Pages). **Steps 1 and later change production and need Christian's explicit approval.** Everything
in "Already done" was safe and reversible.

## Release candidate, 2026-11-14 (code only: no DNS, no domain settings)

Verified today with `scripts/verify-release.sh` (all checks pass): `ccortez.com` A `64.29.17.1`, `216.198.79.1`
(Vercel); `www` CNAME `ccd20a33c6e119dd.vercel-dns-017.com.`; `game` CNAME `co-rtex.github.io.` (GitHub Pages).
The domain table further down is the state **before** the 2026-11-12 cutover, kept for history.

Order matters: the professional site's case studies link to `game.ccortez.com/?bench=<id>`, which only the new
game supports (production's game opens the spawn point and ignores the parameter). **Release the game first.**

Each step needs Christian's explicit approval.

0. Before merging: in each repo, `git fetch` and confirm the branch head is the reviewed one; in the game repo run
   `npm run check:shared-sim` with the professional checkout beside it (all four files "same").
1. **Game.** Merge `game/art-direction-pass` into `main` of `co-rtex/ccortez.com`. **Squash-merge** it: commits
   `21c92a2` and `e68c138` on the branch briefly held a claims-audit decision list (no confidential data; see the
   professional repo's ledger); a squash keeps them out of `main`. Delete the branch afterwards if they should stop
   being reachable. The Pages workflow lints, tests, builds and deploys. Then: `scripts/verify-release.sh`, open
   `https://game.ccortez.com/?bench=taskforge` (TaskForge panel opens), and the arrival screen shows numbered
   flagship badges.
2. **Professional.** Merge `site/visual-identity` into `main` of `co-rtex/portfolio-professional`; Vercel deploys
   `ccortez.com`. Then: `BASE_URL=https://ccortez.com npm run test:e2e` and
   `BASE_URL=https://ccortez.com INTEGRATION_GAME_URL=https://game.ccortez.com npx playwright test integration`
   (8 passed: four flagships, desktop and mobile).

Rollback, in reverse order if both are out: the professional site first (Vercel dashboard or `vercel rollback` to
the previous production deployment; instant, no rebuild), then the game (revert the squash commit on `main`; the
Pages workflow redeploys the previous build). Rolling back only the game leaves the site's bench links opening the
spawn point, which is harmless.

## State before the 2026-11-12 cutover (historical)

| Item | Value | How checked |
| --- | --- | --- |
| `ccortez.com` | A 185.199.108.153, .109, .110, .111 (GitHub Pages), TTL 14400 s | `dig A ccortez.com` |
| `www.ccortez.com` | CNAME `co-rtex.github.io`; 301 → `https://ccortez.com/` | `dig`, `curl -I` |
| `game.ccortez.com` | no record | `dig` |
| Nameservers | `ns-cloud-a1…a4.googledomains.com` (Google Domains DNS, now managed through Squarespace Domains or Google Cloud DNS; check which account holds the zone) | `dig NS` |
| GitHub Pages | source: GitHub Actions workflow on `main`; custom domain `ccortez.com`; certificate approved for `ccortez.com` + `www`; HTTPS enforced | `gh api repos/co-rtex/ccortez.com/pages` |
| `http://ccortez.com` | 301 → https | `curl -I` |
| Vercel `portfolio-professional` | live at https://portfolio-professional-tau.vercel.app, Git-connected (pushes to `main` deploy), **no custom domains** | `vercel domains ls` |

Because Pages deploys from a workflow, the custom domain is the **Pages setting**, not the `public/CNAME` file.
Keep the file in sync anyway for anyone reading the repository.

## Already done (safe, reversible)

- Professional site built, tested and deployed to `portfolio-professional-tau.vercel.app` (38/38 browser tests
  against the deployment; Lighthouse mobile 99/100/100/100).
- Game sprint branch pushed with CI; PR #1 open, not merged. The same build is on a staging-only Vercel project at
  https://ccortez-game-preview.vercel.app for phone testing (`vercel.app` only; not part of production).
- `scripts/verify-release.sh` passes against both staging URLs.

## Cutover procedure

Do the steps in order. Steps 1–4 do not change what visitors see.

1. **Done 2026-11-12 (merge `6b0c825`, verified live).** **Release the game update at the current address.** Mark PR #1 ready, confirm CI is green, and merge it into
   `main`. The Pages workflow redeploys; `ccortez.com` keeps serving the game, now updated. Check it in a browser.
2. **Lower the TTL** of the apex `A` records and `www` to 300 s in the DNS console, then wait at least the old TTL
   (4 hours) so caches pick up the short TTL.
3. **Create the game record:** `game` CNAME `co-rtex.github.io.` (TTL 300). Confirm with `dig +short CNAME game.ccortez.com`.
4. **Done 2026-11-12. Attach domains in Vercel.** `ccortez.com` (primary) and `www.ccortez.com` (308 redirect to the
   apex) are attached to project `portfolio-professional`, both verified. Vercel's recommended records:
   - apex: `A 216.198.79.1` and `A 64.29.17.1` (Vercel's rank-1 values; the older `76.76.21.21` also works)
   - `www`: `CNAME ccd20a33c6e119dd.vercel-dns-017.com.` (rank 1; `cname.vercel-dns.com.` also works)
5. **Switch, DNS first:**
   - 5a. In the Squarespace Domains DNS settings for `ccortez.com`: delete the four GitHub `A` records
     (185.199.108–111.153) and add the two Vercel `A` records above; change `www` from `co-rtex.github.io.` to
     the Vercel CNAME above.
   - 5b. Once `dig +short A ccortez.com` shows only Vercel's addresses (and ideally after the old TTL has passed),
     move Pages to the subdomain: `gh api -X PUT repos/co-rtex/ccortez.com/pages -f cname=game.ccortez.com`, and
     commit `public/CNAME` = `game.ccortez.com` to `main` through a PR.
   Doing DNS first means visitors whose resolvers still cache GitHub's addresses keep getting the game from
   GitHub until 5b, rather than a GitHub 404.
6. **Wait for certificates.** Vercel issues certificates for the apex and `www` automatically once DNS resolves to it.
   GitHub issues one for `game.ccortez.com`; then tick "Enforce HTTPS" on the Pages settings page
   (`gh api -X PUT repos/co-rtex/ccortez.com/pages -F https_enforced=true`).
7. **Verify.**
   - `scripts/verify-release.sh` (defaults to the real domains and adds redirect and DNS checks).
   - In `portfolio-professional`: `BASE_URL=https://ccortez.com npm run test:e2e`.
   - By hand, on a phone and a laptop: home page, resume PDF, a case study, "Play the 3D version", and in the game
     "Portfolio & resume".

After 5b, a visitor whose resolver still caches GitHub's apex addresses gets GitHub's 404 until that cache
expires. Waiting out the TTL before 5b keeps that window close to zero.

## Rollback

- **Apex and www:** restore the four GitHub Pages `A` records (185.199.108.153, 185.199.109.153,
  185.199.110.153, 185.199.111.153) and `www` CNAME `co-rtex.github.io.`; set the Pages custom domain back to
  `ccortez.com` (`gh api -X PUT repos/co-rtex/ccortez.com/pages -f cname=ccortez.com`); revert the `public/CNAME`
  commit. The Vercel domains can stay attached; they only serve traffic that DNS sends to Vercel. To detach them:
  `vercel api /v9/projects/portfolio-professional/domains/www.ccortez.com -X DELETE` (and the same for the apex).
- **Game update only (step 1):** revert the merge commit on `main`; the Pages workflow redeploys the previous build.
- Keep the short TTL until the new setup has been stable for a day, then raise it again.

## After cutover

- Game workbench stories link to `https://ccortez.com/work/...`; those resolve once step 5b is live.
- The professional site's canonical URLs, sitemap and Open Graph tags already use `https://ccortez.com`.
- Delete the staging Vercel project `ccortez-game-preview` when it is no longer useful (optional).
