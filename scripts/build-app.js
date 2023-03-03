/**
 * @license Copyright 2022 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');

const esbuild = require('esbuild');

const command = process.argv[2];
const entryPoint = process.argv[3];
const outdir = process.argv[4];
const publicPath = process.argv[5];

if (!command || !entryPoint || !outdir) {
  throw new Error('missing args');
}

if (!['build', 'watch'].includes(command)) {
  throw new Error('invalid command');
}

/**
 * @param {esbuild.BuildResult} result
 */
function fixHtmlSubresourceUrls(result) {
  if (publicPath !== '/app') return;
  if (!result.metafile) throw new Error('expected metafile');

  const htmls = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.html'));
  const html = htmls[0];
  if (htmls.length !== 1) throw new Error('expected exactly one generated html ' + htmls);

  const htmlText = fs.readFileSync(html, 'utf-8');
  const newHtmlText = htmlText
    .replace('<script src="chunks/', '<script src="/app/chunks/')
    .replace('<link rel="stylesheet" href="chunks/', '<link rel="stylesheet" href="/app/chunks/');
  fs.writeFileSync(html, newHtmlText);
}

async function main() {
  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;

  /** @type {esbuild.BuildOptions} */
  const buildOptions = {
    entryPoints: [entryPoint],
    entryNames: '[name]',
    assetNames: 'assets/[name]-[hash]',
    // Defined chunknames breaks the viewer (probably cuz the -plugin-html), but pairs with fixHtmlSubresourceUrls.
    chunkNames: publicPath ? `chunks/[name]-[hash]` : undefined,
    plugins: [htmlPlugin()],
    loader: {
      '.svg': 'file',
      '.woff': 'file',
      '.woff2': 'file',
    },
    define: {
      'process.env.VIEWER_ORIGIN': JSON.stringify(process.env.VIEWER_ORIGIN || ''),
    },
    publicPath,
    bundle: true,
    outdir,
    minify: true,
    sourcemap: true,
    jsxFactory: 'h',
    watch:
      command === 'watch'
        ? {
            onRebuild(err, result) {
              if (!err && result) {
                fixHtmlSubresourceUrls(result);
              }
            },
          }
        : undefined,
  };

  const result = await esbuild.build(buildOptions);
  fixHtmlSubresourceUrls(result);

  console.log('Built.', new Date());
  if (result.errors.length) console.error(result.errors);
  if (result.warnings.length) console.warn(result.warnings);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
