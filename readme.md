# Lighthouse CI Heroku Deployment

```bash
# Create a heroku project
open https://dashboard.heroku.com/new-app
# Add postgres to your project
open https://elements.heroku.com/addons/heroku-postgresql
# Add the heroku remote repo to our project
heroku git:remote -a <heroku project name>
# Push it to heroku
git push heroku <branch-to-deploy>:master
```
