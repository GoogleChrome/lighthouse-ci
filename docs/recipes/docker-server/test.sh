#!/bin/bash

set -euxo pipefail

docker image build -t lhci-server .
docker volume create lhci-data-test
docker run --name lhci-server-container --mount='source=lhci-data-test,target=/data' --detach lhci-server

set +e
docker exec -i lhci-server-container bash < test-in-container.sh
EXIT_CODE=$?
set -e

docker logs lhci-server-container
docker stop lhci-server-container
docker rm lhci-server-container
docker volume rm lhci-data-test
exit $EXIT_CODE
