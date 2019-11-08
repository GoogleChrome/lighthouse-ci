/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const PRandom = require('@lhci/utils/src/seed-data/prandom.js');
const StorageMethod = require('../../../src/api/storage/storage-method.js');

describe('StorageMethod', () => {
  let prandom;

  beforeEach(() => {
    prandom = new PRandom();
  });

  describe('#generateSlug()', () => {
    it('should use the base slug', () => {
      expect(StorageMethod.generateSlug('My Project')).toEqual('my-project');
      expect(StorageMethod.generateSlug('  10 Things @#$@FSD!')).toEqual('10-things-fsd-');
    });

    it('should cutoff at maxLength', () => {
      expect(StorageMethod.generateSlug('123456789', {maxLength: 5})).toEqual('12345');
    });

    it('should add randomness', () => {
      expect(StorageMethod.generateSlug('12345', {randomLength: 2, prandom})).toEqual('12345-zc');
      expect(StorageMethod.generateSlug('12345', {randomLength: 1, prandom})).toEqual('12345-k');
    });

    it('should truncate to add randomness', () => {
      expect(StorageMethod.generateSlug('12345', {maxLength: 4, randomLength: 2, prandom})).toEqual(
        '1-zc'
      );
    });

    it('should throw if random length is too high', () => {
      expect(() =>
        StorageMethod.generateSlug('1', {maxLength: 4, randomLength: 3, prandom})
      ).toThrow();
    });
  });
});
