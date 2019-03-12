#!/bin/bash

set -e

trap 'kill $(jobs -p)' EXIT

DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LH_ROOT_PATH="$DIRNAME/../.."

cd $LH_ROOT_PATH
yarn start https://example.com --chrome-flags="--headless" --output-path=./lighthouse-ci/ci-test.report.html
node lighthouse-cli/test/fixtures/static-server.js &

cd ./lighthouse-ci
export LHCI_RC_FILE="./test/fixtures/lighthouserc.json"
yarn start server &
yarn start collect --auditUrl=http://localhost:10200/lighthouse-ci/ci-test.report.html
yarn start assert


