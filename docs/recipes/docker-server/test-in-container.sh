#!/bin/bash

set -euxo pipefail

apt-get update && apt-get install -y curl
curl -vvvv http://localhost:9001/version
