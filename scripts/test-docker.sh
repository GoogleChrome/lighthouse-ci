#!/bin/bash

set -euxo pipefail

cd ./docs/recipes/docker-client
bash test.sh
cd ../../../

cd ./docs/recipes/docker-server
bash test.sh
cd ../../../

