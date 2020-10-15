'use strict';

/* eslint-env jest */

/** @type {jest.MockInstance} */
let cronJob = jest.fn().mockReturnValue({start: () => {}});
jest.mock('cron', () => ({
  CronJob: function(...args) {
    // use this indirection because we have to invoke it with `new` and it's harder to mock assertions
    return cronJob(...args);
  },
}));

const {
  startDeletingOldBuildsCron,
  deleteOldBuilds,
} = require('../../src/cron/delete-old-builds.js');

describe('cron/delete-old-builds', () => {
  /** @type {{ findOldBuilds: jest.MockInstance, deleteBuild: jest.MockInstance}} */
  let storageMethod;
  beforeEach(() => {
    storageMethod = {
      findOldBuilds: jest.fn().mockResolvedValue([]),
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
      const deleteObjects = [{id: 'id-1', projectId: 'pid-1'}, {id: 'id-2', projectId: 'pid-2'}];
      storageMethod.findOldBuilds.mockResolvedValue(deleteObjects);
      await deleteOldBuilds(storageMethod, 30, new Date('2019-01-01'));
      expect(storageMethod.deleteBuild).toHaveBeenCalledTimes(deleteObjects.length);

      expect(storageMethod.deleteBuild.mock.calls).toMatchObject([
        ['pid-1', 'id-1'],
        ['pid-2', 'id-2'],
      ]);
    });
  });

  describe('.startDeletingOldBuildsCron', () => {
    it.each([
      [
        'storageMethod is not sql',
        {
          storage: {
            storageMethod: 'notsql',
            deleteOldBuilds: {
              schedule: '0 * * * *',
              dateRange: 30,
            },
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
      startDeletingOldBuildsCron(storageMethod, options);
      expect(cronJob).toHaveBeenCalledTimes(0);
    });
    it.each([
      [
        'no schedule',
        {
          storage: {
            storageMethod: 'sql',
            deleteOldBuilds: {
              dateRange: 30,
            },
          },
        },
      ],
      [
        'no dateRagne',
        {
          storage: {
            storageMethod: 'sql',
            deleteOldBuilds: {
              schedule: '0 * * * *',
            },
          },
        },
      ],
    ])('should throw for invalid options (%s)', (_, options) => {
      expect(() => startDeletingOldBuildsCron(storageMethod, options)).toThrow(/Cannot configure/);
    });
    it('should throw for invalid schedule', () => {
      const options = {
        storage: {
          storageMethod: 'sql',
          deleteOldBuilds: {
            schedule: '* * *',
            dateRange: 30,
          },
        },
      };
      expect(() => startDeletingOldBuildsCron(storageMethod, options)).toThrow(
        /Invalid cron format/
      );
    });
    it('should schedule a cron job', () => {
      startDeletingOldBuildsCron(storageMethod, {
        storage: {
          storageMethod: 'sql',
          deleteOldBuilds: {
            schedule: '0 * * * *',
            dateRange: 30,
          },
        },
      });
      expect(cronJob).toHaveBeenCalledTimes(1);
    });
  });
});
