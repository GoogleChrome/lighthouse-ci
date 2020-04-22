/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const _ = require('../src/lodash.js');

describe('lodash.js', () => {
  describe('#merge', () => {
    it('should merge simple values', () => {
      expect(_.merge(1, 2)).toEqual(2);
      expect(_.merge('foo', 2)).toEqual(2);
      expect(_.merge('foo', undefined)).toEqual(undefined);
      expect(_.merge(1, 'bar')).toEqual('bar');
      expect(_.merge(1, null)).toEqual(null);
    });

    it('should merge arrays by overriding indexes', () => {
      expect(_.merge([1, 2], [3])).toEqual([3, 2]);
      expect(_.merge([1], [])).toEqual([1]);
      expect(_.merge([], [1])).toEqual([1]);
      expect(_.merge([{a: 1}], [{b: 2}])).toEqual([{a: 1, b: 2}]);
    });

    it('should merge objects', () => {
      expect(_.merge({a: 1}, {b: 2})).toEqual({a: 1, b: 2});
      expect(_.merge({a: [1, 2]}, {a: [2]})).toEqual({a: [2, 2]});
      expect(_.merge({a: 1}, {b: undefined})).toEqual({a: 1, b: undefined});
      expect(_.merge({a: {}}, {a: undefined})).toEqual({a: undefined});
      expect(_.merge({a: {}}, {})).toEqual({a: {}});
      expect(_.merge(null, {a: 1})).toEqual({a: 1});
    });

    it('should merge objects recursively', () => {
      const a = {
        foo: {
          x: 1,
          bar: {
            x: 1,
          },
        },
        bar: [1, 3],
      };

      const b = {
        foo: {
          y: 2,
          bar: {
            y: 2,
          },
        },
        bar: [2],
        baz: undefined,
      };

      expect(_.merge(a, b)).toEqual({
        foo: {
          x: 1,
          y: 2,
          bar: {
            x: 1,
            y: 2,
          },
        },
        bar: [2, 3],
        baz: undefined,
      });
    });
  });

  describe('#range', () => {
    it('should generate an array of numbers', () => {
      expect(_.range(0, 5)).toEqual([0, 1, 2, 3, 4]);
      expect(_.range(0, 5, 2)).toEqual([0, 2, 4]);
      expect(_.range(0, 5, 5)).toEqual([0]);
    });
  });

  describe('#isEqual', () => {
    it('should work on inequal simple types', () => {
      expect(_.isEqual(0, 5)).toEqual(false);
      expect(_.isEqual(0, '0')).toEqual(false);
      expect(_.isEqual(0, null)).toEqual(false);
      expect(_.isEqual(NaN, null)).toEqual(false);
      expect(_.isEqual(undefined, null)).toEqual(false);
      expect(_.isEqual('foo', 'bar')).toEqual(false);
    });

    it('should work on equal simple types', () => {
      expect(_.isEqual(0, 0)).toEqual(true);
      expect(_.isEqual(12, 12)).toEqual(true);
      expect(_.isEqual(NaN, NaN)).toEqual(true);
      expect(_.isEqual(null, null)).toEqual(true);
      expect(_.isEqual(undefined, undefined)).toEqual(true);
      expect(_.isEqual('foo', 'foo')).toEqual(true);
    });

    it('should work on objects', () => {
      expect(_.isEqual({x: 1}, {y: 1})).toEqual(false);
      expect(_.isEqual({x: 1}, {x: 1})).toEqual(true);

      expect(_.isEqual({x: 1, y: 2}, {y: 2})).toEqual(false);
      expect(_.isEqual({x: 1, y: 2}, {y: 2, x: 1})).toEqual(true);

      expect(_.isEqual({x: undefined}, {})).toEqual(false);
      expect(_.isEqual({x: undefined}, {x: undefined})).toEqual(true);

      expect(_.isEqual({x: {y: 1}}, {x: {y: 2}})).toEqual(false);
      expect(_.isEqual({x: {y: 1}}, {x: {y: 1}})).toEqual(true);

      expect(_.isEqual({}, null)).toEqual(false);
      expect(_.isEqual(null, {})).toEqual(false);
      expect(_.isEqual({}, {})).toEqual(true);
    });

    it('should work on arrays', () => {
      expect(_.isEqual([1], [2])).toEqual(false);
      expect(_.isEqual([1], [1])).toEqual(true);

      expect(_.isEqual([[1]], [[2]])).toEqual(false);
      expect(_.isEqual([[1]], [[1]])).toEqual(true);

      expect(_.isEqual([[1, 2]], [[1, 2, 3]])).toEqual(false);
      expect(_.isEqual([[1, 2, 3]], [[1, 2]])).toEqual(false);
      expect(_.isEqual([[1, 2]], [[1, 2]])).toEqual(true);
    });
  });

  describe('#kebabCase', () => {
    it('should convert strings to kebab-case', () => {
      // WAI
      expect(_.kebabCase('camelCase')).toEqual('camel-case');
      expect(_.kebabCase('kebab-case')).toEqual('kebab-case');
      expect(_.kebabCase('exampleURL')).toEqual('example-url');

      // Not implemented but should probably work consistently at some point.
      // Tests just for documentation.
      expect(_.kebabCase('kebab-case:document.type')).toEqual('kebab-case:document.type');
      expect(_.kebabCase('mixed-Case3_Issues+')).toEqual('mixed-case3_issues+');
      expect(_.kebabCase('ALL CAPS')).toEqual('all caps');
      expect(_.kebabCase('snake_case')).toEqual('snake_case');
    });

    it('should convert strings to kebab-case alphanumericOnly', () => {
      // WAI
      expect(_.kebabCase('camelCase', {alphanumericOnly: true})).toEqual('camel-case');
      expect(_.kebabCase('kebab-case', {alphanumericOnly: true})).toEqual('kebab-case');
      expect(_.kebabCase('kebab-case:document.type', {alphanumericOnly: true})).toEqual(
        'kebab-case-document-type'
      );
      expect(_.kebabCase('exampleURL', {alphanumericOnly: true})).toEqual('example-url');
      expect(_.kebabCase('!exampleURL', {alphanumericOnly: true})).toEqual('example-url');
      expect(_.kebabCase('mixed-Case3_Issues+', {alphanumericOnly: true})).toEqual(
        'mixed-case3-issues'
      );
      expect(_.kebabCase('ALL CAPS', {alphanumericOnly: true})).toEqual('all-caps');
      expect(_.kebabCase('snake_case', {alphanumericOnly: true})).toEqual('snake-case');
    });
  });

  describe('#startCase', () => {
    it('should convert strings to Human Readable Case', () => {
      // WAI
      expect(_.startCase('camelCase')).toEqual('Camel Case');
      expect(_.startCase('kebab-case')).toEqual('Kebab Case');

      // Not implemented but should probably work consistently at some point.
      // Tests just for documentation.
      expect(_.startCase('ALL CAPS')).toEqual('All caps');
      expect(_.startCase('snake_case')).toEqual('Snake_case');
    });
  });

  describe('#padStart', () => {
    it('should pad the beginning of strings', () => {
      expect(_.padStart('123', 5)).toEqual('  123');
      expect(_.padStart('12345', 5)).toEqual('12345');
      expect(_.padStart('123', 5, '-')).toEqual('--123');
      expect(_.padStart('123', 5, 'apple')).toEqual('le123');
    });
  });

  describe('#uniqBy', () => {
    it('should identify unique items', () => {
      const items = [{a: 1}, {b: 2}, {a: 1}, {b: 3, a: 1}];
      expect(_.uniqBy(items, o => o.a)).toEqual([{a: 1}, {b: 2}]);
      expect(_.uniqBy(items, o => o.b)).toEqual([{a: 1}, {b: 2}, {b: 3, a: 1}]);
    });

    it('should use the first identified item', () => {
      const items = [{a: 1}, {b: 2}, {a: 1}, {b: 3, a: 1}];
      const unique = _.uniqBy(items, o => o.a);
      expect(unique[0]).toBe(items[0]);
      expect(unique[1]).toBe(items[1]);
    });
  });

  describe('#groupBy', () => {
    it('should group items by a key', () => {
      const items = [1, 2, 3, 4, 5];
      expect(_.groupBy(items, x => x % 2)).toEqual([[1, 3, 5], [2, 4]]);
      expect(_.groupBy(items, x => x % 3)).toEqual([[1, 4], [2, 5], [3]]);
    });

    it('should use referential equality for key', () => {
      const items = [1, 2, 3, 4, 5];
      expect(_.groupBy(items, x => x % 2)).toEqual([[1, 3, 5], [2, 4]]);
      expect(_.groupBy(items, x => ({v: x % 2}))).toEqual([[1], [2], [3], [4], [5]]);
    });
  });

  describe('#omit', () => {
    it('should omit keys from an object', () => {
      const o = {a: 1, b: 2, c: 3, d: undefined};
      expect(_.omit(o, ['a'])).toEqual({b: 2, c: 3, d: undefined});
      expect(_.omit(o, ['a', 'b'], {dropUndefined: true})).toEqual({c: 3});
      expect(_.omit(o, [], {dropUndefined: true})).toEqual({a: 1, b: 2, c: 3});
    });
  });
});
