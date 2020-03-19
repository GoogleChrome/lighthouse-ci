/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

module.exports = {
  // Start with google standard style and disable the prettier-controlled rules
  //     https://github.com/google/eslint-config-google/blob/master/index.js
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'google',
    'prettier',
  ],
  // Use the prettier plugin to enforce prettier violations
  plugins: ['prettier', 'import'],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'import/no-extraneous-dependencies': 'error',
    'prettier/prettier': 'error',
    eqeqeq: 'error',
    'no-floating-decimal': 'error',
    'no-empty': [
      'error',
      {
        allowEmptyCatch: true,
      },
    ],
    'no-implicit-coercion': [
      'error',
      {
        boolean: false,
        number: true,
        string: true,
      },
    ],
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: false,
      },
    ],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '(^reject$|^_$)',
        varsIgnorePattern: '(^_$)',
      },
    ],
    strict: ['error', 'global'],
    'prefer-const': 'error',
    curly: ['error', 'multi-line'],

    // Disabled rules
    'require-jsdoc': 0,
    'valid-jsdoc': 0,
    'arrow-parens': 0,
  },
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      globalReturn: true,
      jsx: false,
    },
    sourceType: 'script',
  },
};
