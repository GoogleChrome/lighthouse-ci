/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const express = require('express');
const app = express();
app.get('/', (_, res) => {
  res.send(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>good test page for autorun usage</title>
  </head>
  <body>
    test
  </body>
</html>
  `);
});

const {
  SERVER_START_MESSAGE = 'Server listening on port...',
  SERVER_START_PORT = 52425,
} = process.env;

app.listen(SERVER_START_PORT, () => process.stdout.write(SERVER_START_MESSAGE));
