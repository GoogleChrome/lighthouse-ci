'use strict';

/* eslint-env jest */

const {normalizeCronSchedule} = require('../../src/cron/utils.js');

describe('cron/utils', () => {
  describe('.normalizeCronSchedule()', () => {
    it('should validate string', () => {
      expect(() => normalizeCronSchedule(1)).toThrow(/Schedule must be provided/);
    });

    it('should validate cron job', () => {
      expect(() => normalizeCronSchedule('* * * * *')).toThrow(/too frequent/);
    });

    it('should validate invalid format', () => {
      expect(() => normalizeCronSchedule('* * *')).toThrow(/Invalid cron format/);
    });
  });
});
