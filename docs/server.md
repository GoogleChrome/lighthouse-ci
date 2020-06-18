# LHCI Server

## Overview

The LHCI server saves historical Lighthouse data, displays trends in a dashboard, and offers an in-depth build comparison UI to uncover differences between builds.

<img src="https://user-images.githubusercontent.com/2301202/79480502-c8af9a80-7fd3-11ea-8087-52f6c8ba6f03.png"
alt="Screenshot of the Lighthouse CI server dashboard UI" width="48%"> <img src="https://user-images.githubusercontent.com/2301202/70814650-85c58800-1d91-11ea-925e-af9d03f1b20d.png"
alt="Screenshot of the Lighthouse CI server diff UI" width="48%">

## Deployment

### Requirements

The LHCI server can be run in any node environment with persistent disk storage or network access to a postgres/mysql database.

- Node v10 LTS or later
- Database Storage (sqlite, mysql, or postgresql)

### General

If you'd like to run LHCI on your own infrastructure, you'll need a package.json to install the dependencies via npm. See the [Heroku](./recipes/heroku-server/README.md) and [docker](./recipes/docker-server/README.md) recipes for more examples on how to deploy the LHCI server.

**NOTE:** LHCI really needs to own the entire origin to work as expected. However, if you can't do that and have to operate over a proxy, you can follow the [example of how to configure LHCI on a subpath](./recipes/lhci-server-vpn-proxy/README.md).

```
npm install @lhci/server sqlite3
```

```js
const {createServer} = require('@lhci/server');

console.log('Starting server...');
createServer({
  port: process.env.PORT,
  storage: {
    storageMethod: 'sql',
    sqlDialect: 'sqlite',
    sqlDatabasePath: '/path/to/db.sql',
  },
}).then(({port}) => console.log('LHCI listening on port', port));
```

See the [advanced server configuration examples](./configuration.md#Custom-SSL-Certificate-for-Database-Connection) for more of the available options.

You can also try out running the server locally via the CLI.

```
npm install -D @lhci/cli @lhci/server sqlite3
npx lhci server --storage.storageMethod=sql --storage.sqlDialect=sqlite --storage.sqlDatabasePath=./db.sql
```

### Heroku

LHCI server can be deployed to Heroku on their free tier in just a few minutes. See the [Heroku recipe](./recipes/heroku-server/README.md) for details.

### Docker

LHCI server is ready to go in a docker container that can be deployed to AWS/GCP/Azure in just a few minutes. See the [Docker recipe](./recipes/docker-server/README.md) for details.

You can also try out the docker server locally.

```bash
docker volume create lhci-data
docker container run --publish 9001:9001 --mount='source=lhci-data,target=/data' --detach patrickhulce/lhci-server
```

## Security

The default security model of LHCI server is two-tiered:

- Anyone with HTTP access can _view_ and _create_ data.
- Anyone with the admin token for a project can _edit_ or _delete_ data within that project.

In other words, the server has very weak authentication mechanisms by default and **anyone with HTTP access to the server will be able to view your Lighthouse results and upload data to the server**. If your Lighthouse reports contain sensitive information or you would like to prevent unauthorized users from uploading builds, you have a few options outlined below.

### Build & Admin Tokens

LHCI has two built-in authentication mechanisms enabled by default: the build token and the admin token.

The _build token_ allows a user to _upload new data_ to a particular project, but does not allow the destruction or editing of any historical data. If your project is open source and you want to collect Lighthouse data on pull requests from external contributors then you should consider the _build token_ to be public knowledge.

The _admin token_ allows a user to _edit or delete data_ from a particular project. **The admin token should only be shared with trusted users and never placed in the CI environment**, even in open source projects with external contributors. Anyone with the admin token can delete the entire project's data.

All other actions on the server including listing projects, viewing project and build data, and creating new projects are open to anyone with HTTP access. If you'd like to protect these actions, see the other two authentication mechanisms.

If you forget either of these tokens you will need to connect directly to the storage of the server to reset them using the `lhci wizard` command.

### Basic Authentication

You can secure the Lighthouse CI server with HTTP Basic auth to prevent unauthorized users from wandering into your server. It's built-in to the LHCI server and can be configured with just two properties.

```
lhci server --basicAuth.username=myusername --basicAuth.password=mypassword
```

Be sure to set the same credentials in your upload step to be able to continue sending builds to your server.

```
lhci autorun --upload.basicAuth.username=myusername --upload.basicAuth.password=mypassword
```

When navigating to your server's URL to view results you'll be presented with the classic browser login UI. Provide the same username and password configured on the server and you're in!

![screenshot of classic HTTP Basic auth prompt](https://user-images.githubusercontent.com/2301202/79480775-2d6af500-7fd4-11ea-8841-eb5e85a9fc09.png)

### Firewall Rules

You can also protect your server through firewall rules to prevent it from being accessed from outside your internal network. Refer to your infrastructure provider's documentation on how to setup firewall rules to block external IP addresses from accessing the server. Don't forget to allow your CI machines!
