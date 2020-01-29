/** @typedef {import('../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {Pick<StatisticWithBuild, 'value'>} statistic */
export function getClassNameFromStatistic(statistic) {
  if (statistic.value >= 0.9) return 'score--pass';
  if (statistic.value < 0.5) return 'score--fail';
  return 'score--average';
}

/** @param {Array<StatisticWithBuild>} statistics */
export function computeStatisticRerenderKey(statistics) {
  return statistics
    .map(s => s.id)
    .sort()
    .join(',');
}
