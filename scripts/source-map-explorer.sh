#!/bin/bash

set -euo pipefail

sed -i '' 's/sourceMappingURL=\/app\/chunks/sourceMappingURL=./' ./dist/chunks/*.js
source-map-explorer dist/chunks/entry*.js
