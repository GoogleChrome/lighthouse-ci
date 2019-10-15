#!/bin/bash

NEXT_VERSION=$(yarn info @lhci/server@next | grep 'next:' -A 1 | tail -n 1 | grep -o "'.*'" | sed s/\'//g)
node write-version.js "$NEXT_VERSION"

git add -A
git commit -m 'chore: update lhci server'
git push heroku heroku-deploy:master
