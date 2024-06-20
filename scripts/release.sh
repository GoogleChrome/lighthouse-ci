#!/bin/bash

if ! [ $# -eq 2 ]; then
  echo "Expected two args: CURRENT_VERSION NEXT_VERSION"
  echo "example: 0.12.0 0.13.0"
  exit 1
fi

set -euox pipefail

CURRENT_VERSION=$1
NEXT_VERSION=$2
CURRENT_TAG="v$CURRENT_VERSION"
NEXT_TAG="v$NEXT_VERSION"

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
# hulk npm-publish --lerna

lerna publish '--force-publish=*' --exact --skip-git --repo-version=$NEXT_VERSION --npm-tag=$NPM_TAG --yes
git checkout lerna.json # lerna prettifies the JSON and isn't useful
git tag "$NEXT_TAG"
node ./scripts/print-changelog.js "$CURRENT_TAG" "$NEXT_TAG"
echo "----"
echo "Take the above changelog and add to GH release"

# Do related releases
./scripts/deploy-gh-pages.sh

# Update all the version tags
./scripts/update-version-tags.sh
