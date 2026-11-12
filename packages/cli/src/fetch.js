/**
 * @license Copyright 2021 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const http = require('node:http');
const https = require('node:https');
const zlib = require('node:zlib');
const {ProxyAgent} = require('proxy-agent');

const MAX_REDIRECTS = 20;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

/** @typedef {RequestInit & {agent?: http.Agent}} FetchOptions */

/**
 * @param {Buffer} body
 * @param {string|null} contentEncoding
 * @return {Buffer}
 */
function decompress(body, contentEncoding) {
  switch ((contentEncoding || '').trim().toLowerCase()) {
    case 'gzip':
    case 'x-gzip':
      return zlib.gunzipSync(body);
    case 'deflate':
      return zlib.inflateSync(body);
    case 'br':
      return zlib.brotliDecompressSync(body);
    default:
      return body;
  }
}

/**
 * Performs a single HTTP request (no redirect handling) through `agent` with `node:http(s)`.
 *
 * @param {URL} url
 * @param {{method: string, headers: Record<string, string>, body?: Buffer, signal?: AbortSignal}} request
 * @param {http.Agent} agent
 * @return {Promise<Response>}
 */
function requestWithAgent(url, request, agent) {
  const {method, headers, body, signal} = request;
  const transport = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(url, {method, headers, agent, signal}, res => {
      /** @type {Array<Buffer>} */
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => {
        try {
          const status = res.statusCode || 0;
          const responseHeaders = new Headers();
          for (let i = 0; i < res.rawHeaders.length; i += 2) {
            responseHeaders.append(res.rawHeaders[i], res.rawHeaders[i + 1]);
          }

          const hasNoBody = method === 'HEAD' || NULL_BODY_STATUSES.has(status);
          const responseBody = hasNoBody
            ? null
            : new Uint8Array(
                decompress(Buffer.concat(chunks), res.headers['content-encoding'] || null)
              );
          const response = new Response(responseBody, {
            status,
            statusText: res.statusMessage,
            headers: responseHeaders,
          });
          // `url` can't be set via the Response constructor, but callers may rely on it.
          Object.defineProperty(response, 'url', {value: url.href});
          resolve(response);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end(body);
  });
}

/**
 * A minimal `fetch` built on `node:http`/`node:https` that honors an `http.Agent`, which the
 * native global `fetch` ignores. Follows redirects like `fetch` does (unless `redirect` is set to
 * `'manual'` or `'error'`).
 *
 * @param {Parameters<typeof fetch>[0]} input
 * @param {RequestInit} init
 * @param {http.Agent} agent
 * @return {Promise<Response>}
 */
async function fetchWithAgent(input, init, agent) {
  // Use `Request` to normalize the method, headers, and body exactly like the native `fetch`.
  const request = new Request(input, init);
  const redirectMode = request.redirect;
  let url = new URL(request.url);
  let method = request.method;
  /** @type {Record<string, string>} */
  let headers = Object.fromEntries(request.headers);
  let body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined;

  for (let redirectCount = 0; ; redirectCount++) {
    const response = await requestWithAgent(
      url,
      {method, headers, body, signal: request.signal},
      agent
    );
    const location = response.headers.get('location');
    if (!REDIRECT_STATUSES.has(response.status) || !location || redirectMode === 'manual') {
      return response;
    }

    if (redirectMode === 'error') {
      throw new TypeError(`fetch failed: unexpected redirect to ${location}`);
    }
    if (redirectCount >= MAX_REDIRECTS) {
      throw new TypeError(`fetch failed: maximum redirect count exceeded for ${request.url}`);
    }

    const nextUrl = new URL(location, url);
    if (
      (response.status === 303 && method !== 'HEAD') ||
      ((response.status === 301 || response.status === 302) && method === 'POST')
    ) {
      method = 'GET';
      body = undefined;
      headers = Object.fromEntries(
        Object.entries(headers).filter(([name]) => !/^content-/i.test(name))
      );
    }
    if (nextUrl.origin !== url.origin) {
      headers = Object.fromEntries(
        Object.entries(headers).filter(([name]) => !/^(authorization|cookie)$/i.test(name))
      );
    }
    url = nextUrl;
  }
}

/**
 * The global `fetch`, but routed through `proxy-agent` when proxy environment variables are set
 * (or through `options.agent` when one is provided), since the native `fetch` ignores `agent`.
 *
 * @param {Parameters<typeof fetch>[0]} url
 * @param {FetchOptions} [options]
 * @return {Promise<Response>}
 */
module.exports = (url, options = {}) => {
  const {agent: providedAgent, ...init} = options;
  let agent = providedAgent;
  if (!agent && (process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.NO_PROXY)) {
    agent = new ProxyAgent();
  }

  if (!agent) return fetch(url, init);
  return fetchWithAgent(url, init, agent);
};
