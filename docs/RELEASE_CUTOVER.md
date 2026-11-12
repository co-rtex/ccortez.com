# Release and domain cutover runbook

Goal: `ccortez.com` serves the professional portfolio (Vercel); `game.ccortez.com` serves this 3D game
(GitHub Pages). **Steps 1 and later change production and need Christian's explicit approval.** Everything
in "Already done" was safe and reversible.

## Verified current state (2026-11-13)

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
4. **Attach domains in Vercel** (project `portfolio-professional` → Settings → Domains): add `ccortez.com` and
   `www.ccortez.com`, with `www` redirecting to the apex. Vercel will show "Invalid configuration" and the exact
   DNS records it wants; note them. Nothing changes for visitors yet.
5. **Switch (do 5a and 5b back to back):**
   - 5a. Move Pages to the subdomain: Settings → Pages → Custom domain → `game.ccortez.com` → Save
     (or `gh api -X PUT repos/co-rtex/ccortez.com/pages -f cname=game.ccortez.com`). Commit
     `public/CNAME` = `game.ccortez.com` to `main`.
   - 5b. In DNS, replace the four GitHub `A` records for the apex with the record(s) Vercel showed in step 4
     (commonly `A 76.76.21.21`), and point `www` at the CNAME Vercel showed (commonly `cname.vercel-dns.com`).
     Use Vercel's values, not these examples, if they differ.
6. **Wait for certificates.** Vercel issues certificates for the apex and `www` automatically once DNS resolves to it.
   GitHub issues one for `game.ccortez.com`; then tick "Enforce HTTPS" on the Pages settings page
   (`gh api -X PUT repos/co-rtex/ccortez.com/pages -F https_enforced=true`).
7. **Verify.**
   - `scripts/verify-release.sh` (defaults to the real domains and adds redirect and DNS checks).
   - In `portfolio-professional`: `BASE_URL=https://ccortez.com npm run test:e2e`.
   - By hand, on a phone and a laptop: home page, resume PDF, a case study, "Play the 3D version", and in the game
     "Portfolio & resume".

Between 5a and 5b the apex may briefly return GitHub's 404 for visitors whose DNS still points at GitHub. With a
300 s TTL that window is a few minutes.

## Rollback

- **Apex and www:** restore the four GitHub Pages `A` records (185.199.108.153, 185.199.109.153,
  185.199.110.153, 185.199.111.153) and `www` CNAME `co-rtex.github.io.`; set the Pages custom domain back to
  `ccortez.com`; revert the `public/CNAME` commit. The Vercel project can stay; it only serves domains that point
  at it.
- **Game update only (step 1):** revert the merge commit on `main`; the Pages workflow redeploys the previous build.
- Keep the short TTL until the new setup has been stable for a day, then raise it again.

## After cutover

- Game workbench stories link to `https://ccortez.com/work/...`; those resolve once step 5b is live.
- The professional site's canonical URLs, sitemap and Open Graph tags already use `https://ccortez.com`.
- Delete the staging Vercel project `ccortez-game-preview` when it is no longer useful (optional).
