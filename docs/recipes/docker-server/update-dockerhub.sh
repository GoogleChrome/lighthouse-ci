#!/bin/bash

CURRENT_VERSION=$(node -e "console.log(require('./package.json').dependencies['@lhci/server'])")
LATEST_VERSION=$(git describe --abbrev=0 --tags | sed s/v//g)

if [[ "$CURRENT_VERSION" == "$LATEST_VERSION" ]]; then
  echo "Version is already at $LATEST_VERSION, exiting..."
  exit 0
fi

printf "Previous version is $CURRENT_VERSION\n"
printf "Publish docker version $LATEST_VERSION?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

printf "\nUpdating local files...\n\n"

sed -i "" "s/$CURRENT_VERSION/$LATEST_VERSION/" package.json kubernetes/lhci-deployment.yml
git --no-pager diff .

printf "Continue publishing $LATEST_VERSION?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

printf "\nPublishing!"
sleep 2 # Give the user one more chance to Ctrl+C

docker image build -t lhci .
docker tag lhci:latest "patrickhulce/lhci-server:$LATEST_VERSION"
docker tag "patrickhulce/lhci-server:$LATEST_VERSION" patrickhulce/lhci-server:latest
docker push "patrickhulce/lhci-server:$LATEST_VERSION"
docker push patrickhulce/lhci-server:latest
