#!/bin/bash

set -euox pipefail

if [ -n "$(git status --porcelain)" ]; then
  echo "Cannot release when there are pending changes!"
  git status --porcelain
  exit 1
fi

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]]; then
  echo "Cannot release on a branch other than main!"
  git --no-pager branch
  exit 1
fi

git fetch origin main
if [[ "$(git rev-parse main)" != "$(git rev-parse origin/main)" ]]; then
  echo "Can only publish when changes are synced with origin."
  exit 1
fi

# Build the packages
yarn clean
yarn build

# Release
hulk npm-publish --lerna
git checkout lerna.json # lerna prettifies the JSON and isn't useful

# Do related releases
./scripts/deploy-gh-pages.sh

# Update all the version tags
./scripts/update-version-tags.sh
