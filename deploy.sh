#!/bin/bash
# Deploy modax.app to Cloudflare Pages (project modax-app).
# Publishes a clean copy in dist/ — never the repo root, which holds .git, .claude-flow,
# .wrangler, README.md and other files that must not be public. functions/ stays at the
# project root, where wrangler picks it up from the working directory.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist
rsync -a --exclude '.*' --exclude dist/ --exclude functions/ --exclude node_modules/ \
  --exclude README.md --exclude deploy.sh ./ dist/
NODE_OPTIONS="${NODE_OPTIONS:---network-family-autoselection-attempt-timeout=3000}" \
  npx wrangler pages deploy dist --project-name=modax-app --branch=main
