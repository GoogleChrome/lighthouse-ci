#!/bin/bash

CURRENT_VERSION=$(node -e "console.log(require('./package.json').dependencies['@lhci/server'])")
NEXT_VERSION=$(yarn info @lhci/server | grep 'latest:' -A 1 | tail -n 1 | grep -o "'.*'" | sed s/\'//g)

if [[ "$CURRENT_VERSION" == "$NEXT_VERSION" ]]; then
  echo "Version is already at $NEXT_VERSION, exiting..."
  exit 0
fi

printf "Previous version is $CURRENT_VERSION\n"
printf "Publish docker version $NEXT_VERSION?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

printf "\nUpdating local files...\n\n"

sed "s/$CURRENT_VERSION/$NEXT_VERSION/" package.json kubernetes/lhci-pod.yml
git diff .

printf "Continue publishing $NEXT_VERSION?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

printf "\nPublishing!"
sleep 2 # Give the user one more chance to Ctrl+C

docker image build -t lhci .
docker tag lhci:latest "patrickhulce/lhci-server:$NEXT_VERSION"
docker tag "patrickhulce/lhci-server:$NEXT_VERSION" patrickhulce/lhci-server:latest
docker push "patrickhulce/lhci-server:$NEXT_VERSION"
docker push patrickhulce/lhci-server:latest
