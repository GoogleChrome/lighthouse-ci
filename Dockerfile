FROM patrickhulce/lhci-server:latest

# Overlay custom UI build with CLS support
COPY packages/server/dist/ /usr/src/lhci/node_modules/@lhci/server/dist/

# Overlay patched server-side statistic definitions (adds CLS, bumps VERSION to 3)
COPY packages/server/src/api/statistic-definitions.js /usr/src/lhci/node_modules/@lhci/server/src/api/statistic-definitions.js
