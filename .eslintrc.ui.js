/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

module.exports = {
  extends: ['./.eslintrc.js', 'plugin:react/recommended', 'prettier'],
  plugins: ['react'],
  env: {
    browser: true,
  },
  rules: {
    'import/no-extraneous-dependencies': 'off', // false positives with parcel and less problematic in bundle jsx anyway
    'import/no-unresolved': 'off', // doesn't support parcel's resolution algorithm
    'react/prop-types': 'off',
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '(^reject$|^_$)',
        varsIgnorePattern: '(^_$|^h$)',
      },
    ],
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2019,
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
    allowImportExportEverywhere: true,
  },
  settings: {
    react: {
      version: '16.0', // we're not really using react, but this version is pretty close
      pragma: 'h', // Preact's pragma is `h`
    },
  },
};
