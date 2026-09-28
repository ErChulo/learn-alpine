#!/usr/bin/env bash
# =============================================================================
# publish.sh — put the course online.
#
#   bash scripts/publish.sh            push to GitHub and switch Pages on
#   bash scripts/publish.sh --vercel   deploy to Vercel instead
#
# What it does, in order:
#   1. rebuilds the deployable assets (assets/*.js) and the single HTML file
#   2. commits anything outstanding on `main`
#   3. creates the GitHub repo `learn-alpine` if it does not exist, then pushes
#   4. turns on GitHub Pages for the branch (Settings → Pages, done via API)
#
# Requires: git, and one of
#   • the GitHub CLI (`gh`) — install from https://cli.github.com, then `gh auth login`
#   • or the Vercel CLI for --vercel (`npx vercel login`)
# =============================================================================
set -euo pipefail

REPO_NAME="${REPO_NAME:-learn-alpine}"
BRANCH="${BRANCH:-main}"
cd "$(dirname "$0")/.."

say()  { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
warn() { printf '\033[33m  ! %s\033[0m\n' "$1"; }
ok()   { printf '\033[32m  ✓ %s\033[0m\n' "$1"; }

# --------------------------------------------------------------- 1. build ----
say "Building the deployable files"
if [ -d node_modules ]; then
  npm run --silent build
  npm run --silent build:standalone
else
  warn "node_modules is missing — running the build without esbuild (larger single file)"
  npm install --no-audit --no-fund --silent
  npm run --silent build
  npm run --silent build:standalone
fi
ok "assets/ and learn-alpine.html are up to date"

# ----------------------------------------------------------- 2. vercel mode --
if [ "${1:-}" = "--vercel" ]; then
  say "Deploying to Vercel"
  if ! command -v vercel >/dev/null 2>&1; then
    warn "the Vercel CLI is not installed; using npx (it will ask you to log in once)"
  fi
  npx --yes vercel@latest deploy --prod --yes
  exit 0
fi

# ------------------------------------------------------------- 3. preflight --
say "Checking git and the GitHub CLI"
command -v git >/dev/null 2>&1 || { echo "git is not installed"; exit 1; }

# The project may arrive as a zip rather than a clone — make it a repository.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "no git repository here yet — creating one on branch $BRANCH"
  git init -q -b "$BRANCH" 2>/dev/null || { git init -q; git symbolic-ref HEAD "refs/heads/$BRANCH"; }
fi

command -v gh  >/dev/null 2>&1 || {
  cat <<'EOF'
  The GitHub CLI (`gh`) is not installed. Either install it:
      https://cli.github.com           (macOS: brew install gh · Windows: winget install GitHub.cli)
  then run:  gh auth login
  …or do it by hand:
      git remote add origin https://github.com/<you>/learn-alpine.git
      git push -u origin main
      then Settings → Pages → Source: "Deploy from a branch" → main → / (root) → Save
EOF
  exit 1
}
gh auth status >/dev/null 2>&1 || { echo "  gh is installed but not logged in — run: gh auth login"; exit 1; }
ok "gh is authenticated"

# ------------------------------------------------------- 3b. git identity ---
if ! git config user.email >/dev/null 2>&1; then
  say "No git identity configured in this repo — setting one from your GitHub account"
  LOGIN="$(gh api user -q .login)"
  git config user.name  "$LOGIN"
  git config user.email "$LOGIN@users.noreply.github.com"
  ok "commits will be authored as $LOGIN <$LOGIN@users.noreply.github.com>"
fi

# ------------------------------------------------------------- 4. commit -----
if [ -n "$(git status --porcelain)" ]; then
  say "Committing outstanding changes"
  git add -A
  if git rev-parse --verify HEAD >/dev/null 2>&1; then
    git -c commit.gpgsign=false commit -q -m "Rebuild before publish" || true
  else
    git -c commit.gpgsign=false commit -q -m "learn-alpine: import" || true
  fi
  ok "committed"
else
  ok "nothing to commit"
fi

# ------------------------------------------------------------- 5. create -----
say "Repo: $REPO_NAME"
if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
  ok "already exists on GitHub"
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$(gh repo view "$REPO_NAME" --json sshUrl -q .sshUrl)"
  fi
else
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --disable-wiki
  ok "created"
fi

# ------------------------------------------------------------- 6. push -------
say "Pushing $BRANCH"
git push -u origin "$BRANCH"
ok "pushed"

# ------------------------------------------------------------- 7. pages -----
say "Switching GitHub Pages on"
OWNER_REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
if gh api "repos/$OWNER_REPO/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$OWNER_REPO/pages" \
    -f "source[branch]=$BRANCH" -f "source[path]=/" >/dev/null
  ok "Pages already existed — source re-pointed at $BRANCH / (root)"
else
  gh api -X POST "repos/$OWNER_REPO/pages" \
    -f "source[branch]=$BRANCH" -f "source[path]=/" >/dev/null
  ok "Pages enabled (branch $BRANCH, root folder)"
fi

OWNER="$(gh api user -q .login)"
URL="https://$OWNER.github.io/$REPO_NAME/"
cat <<EOF

  The site is live in a minute or two at:
      $URL

  Repo:  https://github.com/$OWNER_REPO
  Notes: GitHub Pages is free for public repos. If the repo is private you need
         a paid plan; the deployment to Vercel is the alternative:
             bash scripts/publish.sh --vercel
EOF
