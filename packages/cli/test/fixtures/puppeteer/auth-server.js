/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const express = require('express');
const app = express();
app.get('/', (req, res) => {
  const cookies = (req.header('cookie') || '').match(/\w+=/g) || [];
  if (!cookies.includes('loggedin=')) {
    res.status(401);
    res.send(`<!DOCTYPE html><html>Unauthorized`);
    return;
  }

  const userAgent = req.header('user-agent') || '';
  if (!userAgent.includes('lighthouseci')) {
    fs.writeFileSync('ua.tmp.json', JSON.stringify({userAgent}));
    res.status(500);
    res.send(`<!DOCTYPE html><html>Invalid UA`);
    return;
  }

  res.send(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>good test page for collect usage</title>
  </head>
  <body>
    test
  </body>
</html>
  `);
});

app.get('/login', (_, res) => {
  res.cookie('loggedin', '1', {expires: new Date(Date.now() + 15 * 60e3), httpOnly: true});
  res.redirect('/');
});

app.get('/public', (_, res) => res.send('<!DOCTYPE html><h1>Hello</h1>'));

app.listen(52426, () => process.stdout.write('Listening...'));
