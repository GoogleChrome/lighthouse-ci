#!/bin/bash

# This script requires LHCI_CANARY_SERVER_URL and LHCI_CANARY_SERVER_TOKEN variables to be set.

set -ox pipefail

# Start up our LHCI server.
yarn start:server --port=9009 &
# Wait for the server to start before hitting it with data.
sleep 5

# Seed the database with some data for us to audit.
yarn start:seed-database
# Collect our LHCI results.
rm -rf .lighthouseci/
for url in $(LHCI_ROOT_URL=http://localhost:9009 node ./scripts/ci-dogfood-get-urls.js); do
  yarn start collect "--url=$url" --additive || exit 1
done

# Assert our results, but don't fail the build yet.
yarn start assert
EXIT_CODE=$?

if [[ -n "$LHCI_CANARY_SERVER_URL" ]]; then
  # Upload the results to our canary server.
  yarn start upload \
    --serverBaseUrl="$LHCI_CANARY_SERVER_URL" \
    --token="$LHCI_CANARY_SERVER_TOKEN"
fi

# Upload the results to temporary public storage too
export LHCI_GITHUB_STATUS_CONTEXT_SUFFIX="-2"
export LHCI_GITHUB_APP_TOKEN=""
yarn start upload --target=temporary-public-storage


# Kill the LHCI server from earlier.
kill $!

exit $EXIT_CODE
