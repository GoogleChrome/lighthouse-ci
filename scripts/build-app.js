/**
 * @license Copyright 2022 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const command = process.argv[2];
const entryPoint = process.argv[3];
const outdir = process.argv[4];

if (!command || !entryPoint || !outdir) {
  throw new Error('missing args');
}

if (!['build', 'watch'].includes(command)) {
  throw new Error('invalid command');
}

/**
 * 
 * @param {esbuild.BuildResult} result
 */
function insertCollectedStyles(result) {
  if (!result.metafile) throw new Error('expected metafile');

  const stylesheets = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.css'));
  const stylesheet = stylesheets[0];
  if (stylesheets.length === 0) return;
  if (stylesheets.length > 1) throw new Error('expected at most one generated stylesheet');

  const htmls = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.html'));
  const html = htmls[0];
  if (htmls.length !== 1) throw new Error('expected exactly one generated html');

  const needle = '<!-- %CSS% -->';
  const htmlText = fs.readFileSync(html, 'utf-8');
  if (!htmlText.includes(needle)) throw new Error(`expected ${needle} in html`);

  const newHtmlText =
    htmlText.replace(needle, `<link rel="stylesheet" href="${path.relative(outdir, stylesheet)}" />`);
  fs.writeFileSync(html, newHtmlText);
}

async function main() {
  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;
  
  /** @type {esbuild.BuildOptions} */
  const buildOptions = {
    entryPoints: [entryPoint],
    entryNames: '[dir]/[name]-[hash]',
    // @ts-expect-error: Stuck on older version of this plugin, because newest has issues
    // resolving script relative to the html. and creates an index-[hash].html file instead
    // of the expected index.html ... really all kinds of broken.
    // Anyway, this is a type error because of slightly different esbuild version type for Plugin.
    plugins: [htmlPlugin()],
    loader: {
      '.svg': 'file',
      '.woff': 'file',
      '.woff2': 'file',
    },
    publicPath: '/app',
    bundle: true,
    outdir,
    minify: true,
    sourcemap: true,
    jsxFactory: 'h',
    watch: command === 'watch' ? {
      onRebuild(err, result) {
        if (!err && result) insertCollectedStyles(result);
      },
    } : undefined,
  };

  const result = await esbuild.build(buildOptions);
  insertCollectedStyles(result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
