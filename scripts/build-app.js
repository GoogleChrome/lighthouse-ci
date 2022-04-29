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
const defaultPublicPath = undefined;
const publicPath = process.argv[5] || defaultPublicPath;

if (!command || !entryPoint || !outdir) {
  throw new Error('missing args');
}

if (!['build', 'watch'].includes(command)) {
  throw new Error('invalid command');
}

/**
 * @param {esbuild.BuildResult} result
 */
function insertCollectedStyles(result) {
  if (!result.metafile) throw new Error('expected metafile');

  const stylesheets = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.css'));
  const stylesheet = stylesheets[0];
  if (stylesheets.length === 0) return;
  if (stylesheets.length > 1) throw new Error('expected at most one generated stylesheet');

  const href =
    publicPath === defaultPublicPath
      ? path.relative(outdir, stylesheet)
      : `/app/${path.relative(outdir, stylesheet)}`;

  const htmls = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.html'));
  const html = htmls[0];
  if (htmls.length !== 1) throw new Error('expected exactly one generated html');

  const needle = '<!-- %CSS% -->';
  const htmlText = fs.readFileSync(html, 'utf-8');
  if (!htmlText.includes(needle)) throw new Error(`expected ${needle} in html`);

  const newHtmlText = htmlText.replace(needle, `<link rel="stylesheet" href="${href}" />`);
  fs.writeFileSync(html, newHtmlText);
}

/**
 * @param {esbuild.BuildResult} result
 */
function adjustStylesheets(result) {
  if (!result.metafile) throw new Error('expected metafile');

  const fonts = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.woff'));
  const font = fonts[0];
  if (fonts.length === 0) return;

  // todo loop over all???

  const csss = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.css'));
  const css = csss[0];
  if (csss.length !== 1) throw new Error('expected exactly one generated css');

  const cssText = fs.readFileSync(css, 'utf-8');
  const newCssText = cssText.replace(/\/iife\//g, 'XXXXX');
  fs.writeFileSync(css, newCssText);
}

/**
 * @param {esbuild.BuildResult} result
 */
function fixScriptSrc(result) {
  const htmls = Object.keys(result.metafile.outputs).filter(o => o.endsWith('.html'));
  const html = htmls[0];
  console.log({html});
  if (publicPath === defaultPublicPath) return;
  if (!result.metafile) throw new Error('expected metafile');

  if (htmls.length !== 1) throw new Error('expected exactly one generated html');

  const needle = '<script src="';
  const htmlText = fs.readFileSync(html, 'utf-8');
  if (!htmlText.includes(needle)) throw new Error(`expected ${needle} in html`);

  const newHtmlText = htmlText.replace(needle, `${needle}/${publicPath}`);
  fs.writeFileSync(html, newHtmlText);
}

/**
 * @param {esbuild.BuildResult} result
 */
function duplicateSVGs(result) {


}

async function main() {
  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;

  console.log({entryPoint})
  /** @type {esbuild.BuildOptions} */
  const buildOptions = {
    entryPoints: [entryPoint],
    entryNames: '[name]',
    assetNames: 'assets/[name]-[hash]',

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
    define: {
      'process.env.VIEWER_ORIGIN': JSON.stringify(process.env.VIEWER_ORIGIN || ''),
    },
    publicPath,
    bundle: true,
    format: 'esm',
    outdir,
    minify: false,
    sourcemap: true,
    jsxFactory: 'h',
    watch:
      command === 'watch'
        ? {
            onRebuild(err, result) {
              if (!err && result) {
                insertCollectedStyles(result);
                fixScriptSrc(result);
              }
            },
          }
        : undefined,
  };

  console.log(buildOptions); 
  const result = await esbuild.build(buildOptions);
  // insertCollectedStyles(result);
  // fixScriptSrc(result);
  // duplicateSVGs(result);
  // adjustStylesheets(result);
  console.log('Built.', new Date());
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
