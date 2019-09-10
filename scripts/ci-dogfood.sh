#!/bin/bash

# This script requires LHCI_CANARY_SERVER_URL and LHCI_CANARY_SERVER_TOKEN variables to be set.

set -euox pipefail

# Start up our LHCI server.
yarn start:server --port=9009 &
# Wait for the server to start before hitting it with data.
sleep 10

# Seed the database with some data for us to audit.
yarn start:seed-database
# Collect our LHCI results.
yarn start collect --url=http://localhost:9009/app
# Upload the results to our canary server.
yarn start upload --serverBaseUrl="$LHCI_CANARY_SERVER_URL" --token="$LHCI_CANARY_SERVER_TOKEN"

# Kill the LHCI server from earlier.
kill $!
