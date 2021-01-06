#!/bin/bash

set -euox pipefail

# Update the next tag on NPM with latest
LATEST_VERSION=$(git describe --abbrev=0 --tags | sed s/v//g)
npm dist-tag add "@lhci/utils@$LATEST_VERSION" next
npm dist-tag add "@lhci/server@$LATEST_VERSION" next
npm dist-tag add "@lhci/cli@$LATEST_VERSION" next

cd ./docs/recipes/docker-client
./update-dockerhub.sh
cd ../../../

cd ./docs/recipes/docker-server
./update-dockerhub.sh
cd ../../../

git status
git --no-pager diff ./docs
git add ./docs

printf "Continue with the docker commit?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

git commit -m 'chore: update docker images with latest version'
git push
