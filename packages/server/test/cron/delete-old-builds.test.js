/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

/** @type {jest.MockInstance} */
let cronJob = jest.fn().mockReturnValue({start: () => {}});
jest.mock('cron', () => ({
  CronJob: function (...args) {
    // use this indirection because we have to invoke it with `new` and it's harder to mock assertions
    return cronJob(...args);
  },
}));

const {startDeleteOldBuildsCron, deleteOldBuilds} = require('../../src/cron/delete-old-builds.js');

describe('cron/delete-old-builds', () => {
  /** @type {{ findBuildsBeforeTimestamp: jest.MockInstance, deleteBuild: jest.MockInstance}} */
  let storageMethod;
  beforeEach(() => {
    storageMethod = {
      findBuildsBeforeTimestamp: jest.fn().mockResolvedValue([]),
      deleteBuild: jest.fn().mockResolvedValue({}),
    };

    cronJob = jest.fn().mockReturnValue({
      start: () => {},
    });
  });
  describe('.deleteOldBuilds', () => {
    it.each([undefined, null, -1, new Date()])(
      'should throw for invalid range (%s)',
      async range => {
        await expect(deleteOldBuilds(storageMethod, range)).rejects.toMatchObject({
          message: 'Invalid range',
        });
      }
    );

    it('should collect', async () => {
      storageMethod.deleteBuild.mockClear();
      const deleteObjects = [
        {id: 'id-1', projectId: 'pid-1'},
        {id: 'id-2', projectId: 'pid-2'},
      ];
      storageMethod.findBuildsBeforeTimestamp.mockResolvedValue(deleteObjects);
      await deleteOldBuilds(storageMethod, 30, null, null);
      expect(storageMethod.deleteBuild).toHaveBeenCalledTimes(deleteObjects.length);

      expect(storageMethod.deleteBuild.mock.calls).toMatchObject([
        ['pid-1', 'id-1'],
        ['pid-2', 'id-2'],
      ]);
    });

    it('should delete only specified branches', async () => {
      storageMethod.deleteBuild.mockClear();
      const deleteObjects = [
        {id: 'id-1', branch: 'master', projectId: 'pid-1'},
        {id: 'id-2', branch: '123', projectId: 'pid-2'},
      ];
      storageMethod.findBuildsBeforeTimestamp.mockResolvedValue(deleteObjects);
      await deleteOldBuilds(storageMethod, 30, null, ['master']);
      expect(storageMethod.deleteBuild).toHaveBeenCalledTimes(1);

      expect(storageMethod.deleteBuild.mock.calls).toMatchObject([['pid-1', 'id-1']]);
    });

    it('should exclude only specified branches', async () => {
      storageMethod.deleteBuild.mockClear();
      const deleteObjects = [
        {id: 'id-1', branch: 'master', projectId: 'pid-1'},
        {id: 'id-2', branch: '123', projectId: 'pid-2'},
      ];
      storageMethod.findBuildsBeforeTimestamp.mockResolvedValue(deleteObjects);
      await deleteOldBuilds(storageMethod, 30, ['master'], null);
      expect(storageMethod.deleteBuild).toHaveBeenCalledTimes(1);

      expect(storageMethod.deleteBuild.mock.calls).toMatchObject([['pid-2', 'id-2']]);
    });
  });

  describe('.startDeleteOldBuildsCron', () => {
    it.each([
      [
        'storageMethod is not sql',
        {
          storage: {
            storageMethod: 'notsql',
          },
          deleteOldBuildsCron: {
            schedule: '0 * * * *',
            maxAgeInDays: 30,
          },
        },
      ],
      [
        'no deleteOldBuilds options',
        {
          storage: {storageMethod: 'sql'},
        },
      ],
    ])('should not schedule a cron job (%s)', (_, options) => {
      startDeleteOldBuildsCron(storageMethod, options);
      expect(cronJob).toHaveBeenCalledTimes(0);
    });
    it.each([
      [
        'no schedule',
        {
          storage: {
            storageMethod: 'sql',
          },
          deleteOldBuildsCron: {
            maxAgeInDays: 30,
          },
        },
        "Can't configure schedule because you didn't specify 'schedule' field or 'maxAgeInDays' field in item with index: 0",
      ],
      [
        'no dateRange',
        {
          storage: {
            storageMethod: 'sql',
          },
          deleteOldBuildsCron: {
            schedule: '0 * * * *',
          },
        },
        "Can't configure schedule because you didn't specify 'schedule' field or 'maxAgeInDays' field in item with index: 0",
      ],
      [
        "item doesn't have schedule",
        {
          storage: {
            storageMethod: 'sql',
          },
          deleteOldBuildsCron: [
            {
              schedule: '0 * * * *',
              maxAgeInDays: 30,
            },
            {
              maxAgeInDays: 30,
            },
          ],
        },
        "Can't configure schedule because you didn't specify 'schedule' field or 'maxAgeInDays' field in item with index: 1",
      ],
      [
        "item doesn't have dateRange",
        {
          storage: {
            storageMethod: 'sql',
          },
          deleteOldBuildsCron: [
            {
              schedule: '0 * * * *',
              maxAgeInDays: 30,
            },
            {
              schedule: '0 * * * *',
            },
          ],
        },
        "Can't configure schedule because you didn't specify 'schedule' field or 'maxAgeInDays' field in item with index: 1",
      ],
    ])('should throw for invalid options (%s)', (_, options, expectedErrorMessage) => {
      expect(() => startDeleteOldBuildsCron(storageMethod, options)).toThrow(expectedErrorMessage);
    });
    it('should throw for invalid schedule', () => {
      const options = {
        storage: {
          storageMethod: 'sql',
        },
        deleteOldBuildsCron: {
          schedule: '* * *',
          maxAgeInDays: 30,
        },
      };
      expect(() => startDeleteOldBuildsCron(storageMethod, options)).toThrow(/Invalid cron format/);
    });
    it('should schedule a cron job', () => {
      startDeleteOldBuildsCron(storageMethod, {
        storage: {
          storageMethod: 'sql',
        },
        deleteOldBuildsCron: {
          schedule: '0 * * * *',
          maxAgeInDays: 30,
        },
      });
      expect(cronJob).toHaveBeenCalledTimes(1);
    });
  });
});
