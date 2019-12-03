# Heroku-based LHCI Server

## Overview

The LHCI server can be run in any node environment with persistent disk storage or network access to a postgres database. Heroku offers a [free tier of hosting](https://www.heroku.com/pricing) that provides exactly this!

## Setting Up Your Repo

```bash
# Create a directory and repo for your heroku project
mkdir lhci-heroku && cd lhci-heroku && git init
# Setup the LHCI files
curl https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/master/docs/recipes/heroku-server/package.json > package.json
curl https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/master/docs/recipes/heroku-server/server.js > server.js
# Create the project's first commit
git add -A && git commit -m 'Initial commit'
```

## Setting Up Heroku

This assumes you've already signed up, created a heroku account, and installed the [heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

```bash
# Create a new project on heroku
heroku create
# Add a free database to your project using the app name from before
heroku addons:create --app=<APP_NAME_GOES_HERE> heroku-postgresql:hobby-dev
# Deploy your code to heroku
git push heroku master
# Ensure heroku is running your app and open the URL
heroku ps:scale web=1
heroku open
```

## Updating LHCI

Updates are made to the LHCI server from time to time and you'll want to keep up! You can update your LHCI server on Heroku just by pushing a commit.

```bash
# Update LHCI
npm install --save @lhci/server@latest
# Create a commit with your update
git add -A && git commit -m 'update LHCI'
# Deploy your update to heroku
git push heroku master
```
