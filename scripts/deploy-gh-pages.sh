#!/bin/bash

set -e

if [ -n "$(git status --porcelain)" ]; then
  echo "Cannot deploy to gh-pages when there are pending changes!"
  git status --porcelain
  exit 1
fi

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "master" ]]; then
  echo "Cannot deploy to gh-pages on a branch other than master!"
  git --no-pager branch
  exit 1
fi

if [[ "$(git status | grep -c 'Your branch is ahead')" -ge 1 ]]; then
  echo "Cannot deploy to gh-pages on a branch that isn't up to date!"
  git status
  exit 1
fi

# Prep the environment
git pull
git branch -D gh-pages || echo 'First time deploy!'
git checkout -b gh-pages

# Build the packages
yarn clean
yarn build
cp -R packages/viewer/dist ./viewer

# Create and push the deploy commit
git add ./viewer
git commit -m 'gh pages deploy'
git push -uf origin gh-pages

# Cleanup
git checkout -f master
