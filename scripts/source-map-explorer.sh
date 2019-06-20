#!/bin/bash

sed -i '' 's/sourceMappingURL=\/app/sourceMappingURL=./' ./dist/*.js
source-map-explorer dist/entry.*.js
