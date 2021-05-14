#!/bin/bash

set -euxo pipefail

docker image build -t lhci-client .
docker run --name lhci-client-container --detach lhci-client /bin/sleep 1000

set +e
docker exec -i lhci-client-container bash < test-in-container.sh
EXIT_CODE=$?
set -e

docker stop lhci-client-container
docker rm lhci-client-container
exit $EXIT_CODE
