# Release and domain cutover runbook

Goal: `ccortez.com` serves the professional portfolio (Vercel), `game.ccortez.com` serves this 3D game
(GitHub Pages). **Nothing here has been executed.** Every step that touches GitHub settings, Vercel, or DNS
needs Christian's explicit go-ahead.

## Current state (2026-11-12)

- `ccortez.com` → GitHub Pages, deployed from `main` of `co-rtex/ccortez.com` by `.github/workflows/deploy-pages.yml`.
- `public/CNAME` contains `ccortez.com`.
- Professional site: local repo `~/Desktop/Projects/portfolio-professional`, static export, not yet on GitHub or Vercel.

## Order of operations

The order keeps one of the two sites reachable at the apex at all times and lets each step be checked
before the next.

1. **Lower DNS TTLs** for `ccortez.com` and `www` to 300 s a day ahead, if the DNS provider allows it.
2. **Publish the professional site to a preview.**
   - Create a GitHub repository for `portfolio-professional` and push `main`.
   - Import it into Vercel (framework preset: Next.js, default build command). Static export works as-is.
   - Check the preview URL: home, all five case studies, `/resume/`, the PDF, `/sitemap.xml`, `/robots.txt`.
3. **Add the game subdomain.**
   - DNS: `CNAME game → co-rtex.github.io`.
   - Merge the sprint branch into `main` of `co-rtex/ccortez.com` (after review).
4. **Move the game to `game.ccortez.com`.**
   - Change `public/CNAME` to `game.ccortez.com`, commit to `main`; the Pages workflow redeploys.
   - In GitHub → Settings → Pages, confirm the custom domain reads `game.ccortez.com`; enable "Enforce HTTPS"
     once the certificate is issued.
   - From this moment GitHub Pages stops answering for the apex, so do step 5 immediately.
5. **Point the apex at Vercel.**
   - In Vercel → Project → Domains, add `ccortez.com` and `www.ccortez.com`.
   - In DNS, replace the GitHub Pages apex `A` records (185.199.108.153, .109, .110, .111) with the records the
     Vercel domain screen shows, and point `www` at the CNAME Vercel shows.
6. **Verify.**
   - `https://ccortez.com` shows the professional site with a valid certificate; `www` redirects to the apex.
   - `https://game.ccortez.com` loads the island; the recruiter guide link goes back to `ccortez.com`.
   - Cross-links: professional header/footer/contact → game; game guide → professional.

## Rollback

- **Apex:** restore the four GitHub Pages `A` records for `ccortez.com` and remove the Vercel records.
- **Game:** revert the `public/CNAME` commit (back to `ccortez.com`) and push to `main`; set the Pages custom
  domain back to `ccortez.com`.
- The Vercel project and preview can stay up; they do not affect the apex once DNS points elsewhere.

## Known follow-ups after cutover

- Game workbench stories link to `https://ccortez.com/work/...`; those resolve only after step 5.
- The professional site's `metadataBase`, canonical URLs and sitemap already assume `https://ccortez.com`.
