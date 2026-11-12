#!/usr/bin/env bash
# Verifies the two portfolio sites and their cross-links.
#
#   Before cutover (staging):
#     PRO=https://portfolio-professional-tau.vercel.app GAME=https://ccortez-game-preview.vercel.app scripts/verify-release.sh
#   After cutover (defaults):
#     scripts/verify-release.sh
#
# Read-only: it only sends GET/HEAD requests. Exit code is the number of failed checks.
set -u

PRO="${PRO:-https://ccortez.com}"
GAME="${GAME:-https://game.ccortez.com}"
CHECK_DOMAINS="${CHECK_DOMAINS:-$([ "$PRO" = "https://ccortez.com" ] && echo 1 || echo 0)}"
failures=0

pass() { printf '  ok    %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; failures=$((failures + 1)); }

expect_status() { # url expected-status [content-type-substring]
  local out code type
  out=$(curl -sS -o /dev/null -w '%{http_code}|%{ssl_verify_result}|%{content_type}' "$1" 2>&1) || { fail "$1 unreachable: $out"; return; }
  IFS='|' read -r code tls type <<<"$out"
  if [ "$code" = "$2" ] && { [ -z "${3:-}" ] || [[ "$type" == *"$3"* ]]; } && [ "${tls:-0}" = "0" ]; then
    pass "$1 -> $code ${3:+($type)}"
  else
    fail "$1 -> $code $type (tls verify $tls), expected $2 ${3:-}"
  fi
}

expect_body() { # url substring description
  if curl -sS --compressed "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3 (missing '$2' at $1)"; fi
}

expect_redirect() { # url target-prefix
  local loc
  loc=$(curl -sS -o /dev/null -w '%{redirect_url}' "$1")
  if [[ "$loc" == "$2"* ]]; then pass "$1 redirects to $loc"; else fail "$1 redirects to '${loc:-nothing}', expected $2"; fi
}

echo "Professional site: $PRO"
expect_status "$PRO/" 200 text/html
expect_body "$PRO/" "I build software that keeps working" "home page content"
expect_status "$PRO/resume/" 200 text/html
expect_status "$PRO/Christian_Cortez_Resume.pdf" 200 application/pdf
expect_status "$PRO/og.png" 200 image/png
expect_status "$PRO/sitemap.xml" 200 xml
expect_status "$PRO/robots.txt" 200 text/plain
for slug in enginex taskforge quantlab lidar-phenotyping tradegrid; do
  expect_status "$PRO/work/$slug/" 200 text/html
done
expect_status "$PRO/this-page-does-not-exist/" 404
expect_body "$PRO/" "https://game.ccortez.com" "professional site links to the game"

echo "Game: $GAME"
expect_status "$GAME/" 200 text/html
expect_body "$GAME/" "portfolio island" "game boot screen"
expect_body "$GAME/" "https://ccortez.com" "game links to the professional site"
expect_status "$GAME/models/player/ccortez-avatar.gltf" 200

if [ "$CHECK_DOMAINS" = "1" ]; then
  echo "Domains"
  expect_redirect "http://ccortez.com/" "https://ccortez.com/"
  expect_redirect "https://www.ccortez.com/" "https://ccortez.com/"
  expect_redirect "http://game.ccortez.com/" "https://game.ccortez.com/"
  printf '  info  ccortez.com A: %s\n' "$(dig +short A ccortez.com | tr '\n' ' ')"
  printf '  info  www CNAME: %s\n' "$(dig +short CNAME www.ccortez.com | tr '\n' ' ')"
  printf '  info  game CNAME: %s\n' "$(dig +short CNAME game.ccortez.com | tr '\n' ' ')"
fi

echo
if [ "$failures" -eq 0 ]; then echo "All checks passed."; else echo "$failures check(s) failed."; fi
exit "$failures"
