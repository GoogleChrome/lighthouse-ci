/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const crypto = require('crypto');

module.exports = {
  /** Generates a cryptographically psuedorandom alphanumeric string of length 40. @return {string} */
  generateAdminToken() {
    return crypto
      .randomBytes(30)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, 'l');
  },
  /**
   * Hashes an admin token with a given salt. In v0.4.x and earlier, salt is the projectId.
   * @param {string} token
   * @param {string} salt
   */
  hashAdminToken(token, salt) {
    const hash = crypto.createHmac('sha256', salt);
    hash.update(token);
    return hash.digest('hex');
  },
};
