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
const publicPath = process.argv[5];

if (!command || !entryPoint || !outdir) {
  throw new Error('missing args');
}

if (!['build', 'watch'].includes(command)) {
  throw new Error('invalid command');
}

/**
 * All of this is dumb but esbuild-plugin-html is limited and paths are hard.
 *
 * FYI If you see a static resource served as HTML, then the express router attempted use
 * a static file, but didnt see it on disk, and instead served the HTML. The problem will probably
 * be in here.
 * @param {esbuild.BuildResult} result
 * @param {esbuild.BuildOptions} buildOptions
 */
function fixHtmlSubresourceUrls(result, buildOptions) {
  // Viewer uses a publicPath of ./, Server uses /app.

  if (!result.metafile) throw new Error('expected metafile');

  console.log(buildOptions);
  const htmls = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.html'));
  const csss = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.css'));
  if (htmls.length !== 1) throw new Error('expected exactly one generated html');
  if (csss.length !== 1) throw new Error('expected exactly one generated html');
  const htmlDistPath = htmls[0];
  const cssDistPath = csss[0];

  const htmlText = fs.readFileSync(htmlDistPath, 'utf-8');

  /** @param {string} filepath */
  const resolveToWebPath = filepath => {
    if (!buildOptions.outdir || !buildOptions.publicPath) {
      throw new Error('missing args');
    }
    const relativePath = path.relative(buildOptions.outdir, filepath);
    // const x =  path.join(buildOptions.publicPath, path.sep, relativePath);
    const ret = `${buildOptions.publicPath}${relativePath}`;
    console.log({filepath, pp: buildOptions.publicPath, ret});
    return ret;
  };

  const adjustedCssPath = `"${buildOptions.publicPath}${path.relative(buildOptions.outdir, cssDistPath)}`
  const newHtmlText = htmlText
  // noop @chialab/esbuild-plugin-html's stupid css loading technique
    .replace('<script type="application/javascript">', '<script type="dumb-dont-run-this">')
    .replace('<script src="chunks/', `<script src="${buildOptions.publicPath}chunks/`)
    .replace(
      '</head>',
      `
    <link rel="stylesheet" href="${resolveToWebPath(cssDistPath)}">
    <!--                 orthis ${adjustedCssPath}       -->
    </head>
    `
    );
  fs.writeFileSync(htmlDistPath, newHtmlText);

  const cssText = fs.readFileSync(cssDistPath, 'utf-8');
  // Don't source icons relative to the chunks/css file.
  const newCssText = cssText.replaceAll(`url(./assets`, `url(../assets`);
  fs.writeFileSync(cssDistPath, newCssText);
}

async function main() {
  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;
  console.log({entryPoint});
  /** @type {esbuild.BuildOptions} */
  const buildOptions = {
    entryPoints: [entryPoint],
    entryNames: '[name]',
    assetNames: 'assets/[name]-[hash]',
    // Defined chunknames breaks the viewer (probably cuz the -plugin-html), but pairs with fixHtmlSubresourceUrls.
    chunkNames: `chunks/[name]-[hash]`,
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
                fixHtmlSubresourceUrls(result, buildOptions);
              }
            },
          }
        : undefined,
  };

  const result = await esbuild.build(buildOptions);
  fixHtmlSubresourceUrls(result, buildOptions);

  console.log('Built.', new Date());
  if (result.errors.length) console.error(result.errors);
  if (result.warnings.length) console.warn(result.warnings);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
