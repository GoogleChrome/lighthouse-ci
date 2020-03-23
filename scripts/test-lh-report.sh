#!/bin/bash

set -e

trap 'kill $(jobs -p)' EXIT

DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LH_ROOT_PATH="$DIRNAME/../.."

cd $LH_ROOT_PATH
node lighthouse-cli/test/fixtures/static-server.js &
yarn start http://localhost:10200/dobetterweb/dbw_tester.html --chrome-flags="--headless" --output-path=./lighthouse-ci/ci-test.report.html

cd ./lighthouse-ci
export LHCI_CONFIG="./test/fixtures/lighthouserc.json"
yarn start server &
yarn start collect --url=http://localhost:10200/lighthouse-ci/ci-test.report.html
yarn start assert
