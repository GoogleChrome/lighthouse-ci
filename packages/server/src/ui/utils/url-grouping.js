/**
 * URL Grouping Utilities
 * Groups URLs by page type and aggregates statistics across groups.
 */

/** @typedef {{name: string, label: string, pattern: RegExp}} PageTypePattern */
/** @typedef {import('../routes/project-dashboard/project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/** Page type patterns for StubHub URLs.
 *  Matches both real URLs (e.g. /slug/performer/12345/) and
 *  bracket-replaced URLs (e.g. /[performer]/).
 */
export const PAGE_TYPE_PATTERNS = [
  { name: 'home', label: 'Home', pattern: /^\/?$/ },
  { name: 'performer', label: 'Performer', pattern: /\/performer\/|\/\[performer\]/ },
  { name: 'category', label: 'Category', pattern: /\/category\/|\/\[category\]/ },
  { name: 'grouping', label: 'Grouping', pattern: /\/grouping\/|\/\[grouping\]/ },
  { name: 'event', label: 'Event', pattern: /\/event\/|\/\[event\]/ },
  { name: 'venue', label: 'Venue', pattern: /\/venue\/|\/\[venue\]/ },
  { name: 'geography', label: 'Geography', pattern: /\/geography\/|\/\[geography\]/ },
];

// Group identifier prefix to distinguish from real URLs
const GROUP_PREFIX = '__group:';

/**
 * Get the page type name for a URL
 * @param {string} url
 * @returns {string} page type name or 'other'
 */
export function getPageType(url) {
  // Strip protocol and hostname if present
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  for (const pt of PAGE_TYPE_PATTERNS) {
    if (pt.pattern.test(path)) return pt.name;
  }
  return 'other';
}

/**
 * Group an array of URL objects by page type.
 * @param {Array<{url: string}>} urlObjects - Array of {url: string} from the API
 * @returns {Array<{name: string, label: string, urls: string[], value: string}>}
 */
export function groupUrlsByPageType(urlObjects) {
  const groups = new Map();

  for (const {url} of urlObjects) {
    const typeName = getPageType(url);
    if (!groups.has(typeName)) {
      const pt = PAGE_TYPE_PATTERNS.find(p => p.name === typeName);
      groups.set(typeName, {
        name: typeName,
        label: pt ? pt.label : 'Other',
        urls: [],
        value: GROUP_PREFIX + typeName,
      });
    }
    groups.get(typeName).urls.push(url);
  }

  // Sort: home first, then alphabetically, 'other' last
  const result = [...groups.values()].sort((a, b) => {
    if (a.name === 'home') return -1;
    if (b.name === 'home') return 1;
    if (a.name === 'other') return 1;
    if (b.name === 'other') return -1;
    return a.label.localeCompare(b.label);
  });

  return result;
}

/**
 * Check if a value is a group identifier (vs a real URL)
 * @param {string} value
 * @returns {boolean}
 */
export function isGroupValue(value) {
  return value && value.startsWith(GROUP_PREFIX);
}

/**
 * Extract the group name from a group value
 * @param {string} groupValue
 * @returns {string}
 */
export function getGroupName(groupValue) {
  return groupValue.replace(GROUP_PREFIX, '');
}

/**
 * Create dropdown options for grouped URL view
 * @param {Array<{name: string, label: string, urls: string[], value: string}>} groups
 * @returns {Array<{value: string, label: string}>}
 */
export function createGroupedDropdownOptions(groups) {
  return groups.map(g => ({
    value: g.value,
    label: g.label,
  }));
}

/**
 * Aggregate statistics by page type pattern.
 * For each build, finds ALL stats whose URL matches the page type,
 * then computes the mean value per (buildId, statName).
 * This works even when different builds crawl different individual URLs.
 *
 * @param {Array<StatisticWithBuild>} stats - All statistics (unfiltered or pre-filtered to a build set)
 * @param {string} pageTypeName - Page type name (e.g., 'performer', 'category')
 * @returns {Array<StatisticWithBuild>} Aggregated stats with one entry per (buildId, name)
 */
export function aggregateStatistics(stats, pageTypeName) {
  // Filter to stats whose URL matches the page type
  const groupStats = stats.filter(s => getPageType(s.url) === pageTypeName);

  // Group by (buildId, name)
  const buckets = new Map();
  for (const stat of groupStats) {
    const key = `${stat.buildId}::${stat.name}`;
    if (!buckets.has(key)) {
      buckets.set(key, { sum: 0, count: 0, template: stat });
    }
    const bucket = buckets.get(key);
    if (stat.value !== -1) { // -1 means "not available" in LHCI
      bucket.sum += stat.value;
      bucket.count++;
    }
  }

  // Produce aggregated stats
  const result = [];
  for (const [, bucket] of buckets) {
    if (bucket.count === 0) continue;
    result.push({
      ...bucket.template,
      url: GROUP_PREFIX + 'aggregated', // Mark as aggregated
      value: bucket.sum / bucket.count,
    });
  }

  return result;
}

/**
 * Find the URLs belonging to a group from the available URL list
 * @param {string} groupValue - The group value (e.g., '__group:performer')
 * @param {Array<{url: string}>} allUrls - All available URLs
 * @returns {string[]} URLs in the group
 */
export function getUrlsForGroup(groupValue, allUrls) {
  const groupName = getGroupName(groupValue);
  return allUrls
    .map(u => u.url)
    .filter(url => getPageType(url) === groupName);
}
