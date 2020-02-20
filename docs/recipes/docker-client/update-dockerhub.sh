#!/bin/bash

CURRENT_VERSION=$(grep 'lhci/cli' Dockerfile | sed s/.*@//g)
NEXT_VERSION=$(yarn info @lhci/cli | grep 'latest:' -A 1 | tail -n 1 | grep -o "'.*'" | sed s/\'//g)

if [[ "$CURRENT_VERSION" == "$NEXT_VERSION" ]]; then
  echo "Version is already at $NEXT_VERSION, exiting..."
  exit 0
fi

printf "Previous version is $CURRENT_VERSION\n"
printf "Publish docker version $NEXT_VERSION?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

printf "\nUpdating local files...\n\n"

sed -i "" "s/$CURRENT_VERSION/$NEXT_VERSION/" Dockerfile
git --no-pager diff .

printf "Continue publishing $NEXT_VERSION?\n"
read -n 1 -p "Press any key to continue, Ctrl+C to exit..."

printf "\nPublishing!"
sleep 2 # Give the user one more chance to Ctrl+C

docker image build -t lhci-client .
docker tag lhci-client:latest "patrickhulce/lhci-client:$NEXT_VERSION"
docker tag "patrickhulce/lhci-client:$NEXT_VERSION" patrickhulce/lhci-client:latest
docker push "patrickhulce/lhci-client:$NEXT_VERSION"
docker push patrickhulce/lhci-client:latest
