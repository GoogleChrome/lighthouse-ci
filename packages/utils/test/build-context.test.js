/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const buildContext = require('../src/build-context.js');

describe('build-context.js', () => {
  // commit e7f1b0fa3aebb6ef95e44c0d0b820433ffdd2e63
  // Author: Patrick Hulce <patrick.hulce@gmail.com>
  // Date:   Tue Oct 29 16:43:39 2019 -0500
  //
  //   feat(server): add version endpoint
  //
  const hash = 'e7f1b0fa3aebb6ef95e44c0d0b820433ffdd2e63';

  describe('#getCurrentHash()', () => {
    it('should work', () => {
      expect(buildContext.getCurrentHash()).toMatch(/^[a-f0-9]{40}$/);
    });
  });

  describe('#getCommitTime()', () => {
    it('should work', () => {
      expect(buildContext.getCommitTime(hash)).toEqual('2019-10-29T16:43:39-05:00');
    });
  });

  describe('#getCurrentBranch()', () => {
    it('should not throw', () => {
      buildContext.getCurrentBranch(hash);
    });
  });

  describe('#getCommitMessage()', () => {
    it('should work', () => {
      expect(buildContext.getCommitMessage(hash)).toEqual('feat(server): add version endpoint');
    });
  });

  describe('#getAuthor()', () => {
    it('should work', () => {
      expect(buildContext.getAuthor(hash)).toEqual('Patrick Hulce <patrick.hulce@gmail.com>');
    });
  });

  describe('#getAvatarUrl()', () => {
    it('should work', () => {
      expect(buildContext.getAvatarUrl(hash)).toEqual(
        'https://www.gravatar.com/avatar/78bafdcaf40e20b90bb76b9aa5834e11.jpg?d=identicon'
      );
    });
  });

  describe('#getAncestorHashForMaster()', () => {
    it('should work', () => {
      expect(buildContext.getAncestorHashForMaster(hash)).toEqual(
        'ec95bc8ad992c9d68845040d612fbbbe94ad7f13'
      );
    });
  });

  describe('#getAncestorHashForBranch()', () => {
    it('should work', () => {
      expect(buildContext.getAncestorHashForBranch(hash)).toEqual(hash);
    });
  });
});
