/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Recursively merges properties of v2 into v1. Mutates o1 in place, does not return a copy.
 *
 * @template T
 * @param {T} v1
 * @param {T} v2
 * @return {T}
 */
function merge(v1, v2) {
  if (Array.isArray(v1)) {
    if (!Array.isArray(v2)) return v2;

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      v1[i] = i < v2.length ? merge(v1[i], v2[i]) : v1[i];
    }

    return v1;
  } else if (typeof v1 === 'object' && v1 !== null) {
    if (typeof v2 !== 'object' || v2 === null) return v2;
    /** @type {Record<string, *>} */
    const o1 = v1;
    /** @type {Record<string, *>} */
    const o2 = v2;

    const o1Keys = new Set(Object.keys(o1));
    const o2Keys = new Set(Object.keys(o2));
    for (const key of new Set([...o1Keys, ...o2Keys])) {
      o1[key] = key in o2 ? merge(o1[key], o2[key]) : o1[key];
    }

    return v1;
  } else {
    return v2;
  }
}

/**
 * Converts a string from camelCase to kebab-case.
 * @param {string} s
 */
function kebabCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * @template TKey
 * @template TValue
 * @param {Array<TValue>} items
 * @param {(item: TValue) => TKey} keyFn
 * @return {Map<TKey, Array<TValue>>}
 */
function groupIntoMap(items, keyFn) {
  /** @type {Map<TKey, Array<TValue>>} */
  const groups = new Map();

  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

module.exports = {
  merge,
  kebabCase,
  /**
   * Generates an array of numbers from `from` (inclusive) to `to` (exclusive)
   * @param {number} from
   * @param {number} to
   * @param {number} [by]
   * @return {Array<number>}
   */
  range(from, to, by = 1) {
    /** @type {Array<number>} */
    const numbers = [];
    for (let i = from; i < to; i += by) {
      numbers.push(i);
    }
    return numbers;
  },
  /**
   * Converts a string from kebab-case or camelCase to Start Case.
   * @param {string} s
   */
  startCase(s) {
    return kebabCase(s)
      .split('-')
      .map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
      .join(' ');
  },
  /**
   * Deep clones an object via JSON.parse/JSON.stringify.
   * @template T
   * @param {T} o
   * @return {T}
   */
  cloneDeep(o) {
    return JSON.parse(JSON.stringify(o));
  },
  /**
   * Filters items by referential uniqueness of the value returned by keyFn.
   * Unique items are guaranteed to be in the same order of the original array.
   *
   * @template TArr
   * @template TKey
   * @param {Array<TArr>} items
   * @param {(item: TArr) => TKey} keyFn
   * @return {Array<TArr>}
   */
  uniqBy(items, keyFn) {
    /** @type {Set<TKey>} */
    const seen = new Set();
    /** @type {Array<TArr>} */
    const out = [];

    for (const item of items) {
      const key = keyFn(item);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }

    return out;
  },
  /**
   * @template T
   * @param {Array<T>} items
   * @param {(item: T) => any} keyFn
   * @return {Array<Array<T>>}
   */
  groupBy(items, keyFn) {
    return [...groupIntoMap(items, keyFn).values()];
  },
  groupIntoMap,
  /**
   * @template T
   * @param {T} object
   * @param {Array<keyof T>} propertiesToDrop
   * @param {{dropUndefined?: boolean}} [options]
   * @return {Partial<T>}
   */
  omit(object, propertiesToDrop, options = {}) {
    /** @type {Partial<T>} */
    const out = {};
    for (const [key_, value] of Object.entries(object)) {
      const key = /** @type {keyof T} */ (key_);
      if (propertiesToDrop.includes(key)) continue;
      if (options.dropUndefined && value === undefined) continue;
      out[key] = value;
    }

    return out;
  },
};
