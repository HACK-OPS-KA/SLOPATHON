#!/usr/bin/env bash
# One-shot SLOPATHON submitter for Calendar Council.
#
# Prereqs:
#   1. Fork https://github.com/HACK-OPS-KA/SLOPATHON on GitHub (web UI).
#   2. Have git able to push to your fork (a credential helper or a PAT).
#
# Usage:
#   GH_USER=<your-github-username> bash SUBMIT.sh
#   (optional) PROJECT=my-folder-name  to change the folder name.
#
# It clones your fork, copies the _template, overlays this project's source
# (excluding node_modules/.next/dev.db/.env), commits and pushes a branch.
# Then open a PR titled:  [SUBMISSION] Calendar Council
set -euo pipefail

: "${GH_USER:?Set GH_USER to your GitHub username, e.g. GH_USER=octocat bash SUBMIT.sh}"
PROJECT="${PROJECT:-calendar-council}"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"

echo "→ Cloning your fork: github.com/$GH_USER/SLOPATHON"
git clone "https://github.com/$GH_USER/SLOPATHON.git" "$WORK/SLOPATHON"
cd "$WORK/SLOPATHON"

git remote add upstream https://github.com/HACK-OPS-KA/SLOPATHON.git
git fetch upstream
git checkout -b "submission/$PROJECT" upstream/main

echo "→ Creating projects/$PROJECT from template + this project"
cp -r projects/_template "projects/$PROJECT"
rsync -a \
  --exclude node_modules --exclude .next --exclude .git \
  --exclude '.env' --exclude '*.db' --exclude '*.db-journal' \
  --exclude '.DS_Store' --exclude '*.tsbuildinfo' \
  "$SRC_DIR/" "projects/$PROJECT/"

git add "projects/$PROJECT"
git commit -m "Add Calendar Council submission"
git push -u origin HEAD

echo ""
echo "✅ Pushed to branch submission/$PROJECT on your fork."
echo "   Open a pull request to HACK-OPS-KA/SLOPATHON titled:"
echo "     [SUBMISSION] Calendar Council"
