#!/bin/bash

set -euox pipefail

if [ -n "$(git status --porcelain)" ]; then
  echo "Cannot release when there are pending changes!"
  git status --porcelain
  exit 1
fi

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "master" ]]; then
  echo "Cannot release on a branch other than master!"
  git --no-pager branch
  exit 1
fi

git fetch origin master
if [[ "$(git rev-parse master)" != "$(git rev-parse origin/master)" ]]; then
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

# Update the next tag
NEXT_VERSION=$(yarn info @lhci/cli | grep 'latest:' -A 1 | tail -n 1 | grep -o "'.*'" | sed s/\'//g)
npm dist-tag add "@lhci/utils@$NEXT_VERSION" next
npm dist-tag add "@lhci/server@$NEXT_VERSION" next
npm dist-tag add "@lhci/cli@$NEXT_VERSION" next

cd ./docs/recipes/docker-client
./update-dockerhub.sh
cd ../../../

cd ./docs/recipes/docker-server
./update-dockerhub.sh
cd ../../../

git status
git --no-pager diff .
git add -A

printf "Continue with the docker commit?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

git commit -m 'chore: update docker images with latest version'
git push
