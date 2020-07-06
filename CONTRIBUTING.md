# How to Contribute

We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow.

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution;
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Community Guidelines

This project follows [Google's Open Source Community
Guidelines](https://opensource.google.com/conduct/).

# Codebase

Before contributing to the code, get an overview of how Lighthouse works in the [architecture documentation](./docs/architecture.md).

## Monorepo

The codebase is organized in a typical monorepo setup using [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) and [lerna](https://github.com/lerna/lerna). Individual packages are located in `packages/*` directories each with their own `package.json`, scripts, and tests. Running `yarn` at the repository root will create symlinks for all local packages in `node_modules/@lhci` meaning changes you make in `packages/utils` will automatically be used by `require('@lhci/utils')` in `packages/cli` without further build steps. 

## Dependencies

```bash
npm install -g yarn
yarn install # run in the repo root
```

## Development Flow

When working on the CLI, simply make your changes to `packages/cli` or `packages/utils` files and run `yarn start <LHCI arguments here>`. No build step necessary.

When working on the server, you'll need to start parcel in watch mode. In one terminal run `yarn build:watch` from the repo root. In another terminal run `yarn start:server`. If you made any changes to the APIs of the server, you will need to restart the `yarn start:server` command, but UI changes should be picked up on refresh without restarting the server process. Once the server is up and running you can fill it with some test data by running `yarn start:seed-database` in another terminal.

## Server Organization

The server has three primary components: the API, the UI, and cron jobs.

The API is a standard node express server. Code for the API lives in `packages/server/src/api/`.

The UI is written in [preact](https://preactjs.com/) and bundled with [parcel](https://parceljs.org/). Code for the UI lives in `packages/server/src/ui/`. This is the only part of Lighthouse CI that requires a build step in order to use.

The cron jobs are periodic tasks that run while the server is alive. Code for the cron jobs lives in `packages/server/src/cron/`.

## Tests

Any non-trivial functionality should be accompanied by a test. [jest](https://jestjs.io/) is our test runner for unit and integration tests. Front-end components use [storybook](https://storybook.js.org/) examples and/or end-to-end puppeteer tests that get run in the same steps as unit tests. 

Typechecking is performed by [TypeScript's checkJs option](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html). All new code should leverage JSDoc type annotations and avoid the use of `any`.

```bash
yarn test:typecheck
yarn test:lint
yarn test:unit
yarn test # run all of the above
```

If working on MySQL or PostgreSQL support in the server, you'll need additional dependencies.

**Example for MySQL:**

```bash
brew install mysql
brew services start mysql
mysql -e "CREATE DATABASE IF NOT EXISTS lighthouse_ci_test;" -u root
mysql -e "GRANT ALL ON lighthouse_ci_test.* TO 'lhci'@'localhost';" -u root
mysql -e ALTER USER 'lhci'@'localhost' IDENTIFIED BY 'password';' -u root
export MYSQL_DB_URL="mysql://lhci:password@localhost/lighthouse_ci_test"
yarn test
```
