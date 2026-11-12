/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const http = require('http');
const zlib = require('zlib');
const fetch = require('../src/fetch.js');

/**
 * @param {http.RequestListener} handler
 * @return {Promise<{server: http.Server, origin: string, requests: Array<{method?: string, url?: string, headers: http.IncomingHttpHeaders, body: string}>}>}
 */
async function startServer(handler) {
  /** @type {Array<{method?: string, url?: string, headers: http.IncomingHttpHeaders, body: string}>} */
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      requests.push({method: req.method, url: req.url, headers: req.headers, body});
      handler(req, res);
    });
  });
  await new Promise(resolve => server.listen(0, 'localhost', () => resolve(undefined)));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Invalid server address');
  return {server, origin: `http://localhost:${address.port}`, requests};
}

/** @param {http.Server} server */
const closeServer = server => new Promise(resolve => server.close(resolve));

describe('fetch', () => {
  const originalEnv = {...process.env};

  afterEach(() => {
    process.env = {...originalEnv};
  });

  describe('without an agent or proxy env vars', () => {
    beforeEach(() => {
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      delete process.env.NO_PROXY;
    });

    it('should use the global fetch', async () => {
      const globalFetch = jest.spyOn(global, 'fetch');
      const {server, origin} = await startServer((req, res) => res.end('ok'));
      try {
        const response = await fetch(`${origin}/path`, {method: 'GET'});
        expect(await response.text()).toEqual('ok');
        expect(globalFetch).toHaveBeenCalledWith(`${origin}/path`, {method: 'GET'});
      } finally {
        globalFetch.mockRestore();
        await closeServer(server);
      }
    });
  });

  describe('with an agent', () => {
    /** @type {Awaited<ReturnType<typeof startServer>>} */
    let target;
    /** @type {http.Agent} */
    let agent;

    beforeEach(async () => {
      agent = new http.Agent();
      target = await startServer((req, res) => {
        if (req.url === '/json') {
          res.writeHead(201, 'Created', {'content-type': 'application/json', 'x-custom': 'yes'});
          res.end(JSON.stringify({hello: 'world'}));
        } else if (req.url === '/gzip') {
          res.writeHead(200, {'content-encoding': 'gzip'});
          res.end(zlib.gzipSync('compressed'));
        } else if (req.url === '/redirect-303') {
          res.writeHead(303, {location: '/json'});
          res.end();
        } else if (req.url === '/redirect-307') {
          res.writeHead(307, {location: `${target.origin}/echo`});
          res.end();
        } else if (req.url === '/redirect-loop') {
          res.writeHead(302, {location: '/redirect-loop'});
          res.end();
        } else if (req.url === '/no-content') {
          res.writeHead(204);
          res.end();
        } else {
          res.end('ok');
        }
      });
    });

    afterEach(async () => {
      agent.destroy();
      await closeServer(target.server);
    });

    it('should route the request through the agent and return a Response', async () => {
      const globalFetch = jest.spyOn(global, 'fetch');
      const createConnection = jest.spyOn(agent, 'createConnection');
      try {
        const response = await fetch(`${target.origin}/json`, {agent});
        expect(response).toBeInstanceOf(Response);
        expect(response.ok).toBe(true);
        expect(response.status).toEqual(201);
        expect(response.statusText).toEqual('Created');
        expect(response.url).toEqual(`${target.origin}/json`);
        expect(response.headers.get('x-custom')).toEqual('yes');
        expect(await response.json()).toEqual({hello: 'world'});
        expect(createConnection).toHaveBeenCalled();
        expect(globalFetch).not.toHaveBeenCalled();
      } finally {
        globalFetch.mockRestore();
      }
    });

    it('should send the method, headers, and body', async () => {
      const response = await fetch(`${target.origin}/echo`, {
        agent,
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-token': 'secret'},
        body: JSON.stringify({a: 1}),
      });
      expect(await response.text()).toEqual('ok');
      expect(target.requests).toHaveLength(1);
      expect(target.requests[0]).toMatchObject({
        method: 'POST',
        url: '/echo',
        body: '{"a":1}',
        headers: {'content-type': 'application/json', 'x-token': 'secret', 'content-length': '7'},
      });
    });

    it('should decompress encoded responses', async () => {
      const response = await fetch(`${target.origin}/gzip`, {agent});
      expect(await response.text()).toEqual('compressed');
    });

    it('should handle responses without a body', async () => {
      const response = await fetch(`${target.origin}/no-content`, {agent});
      expect(response.status).toEqual(204);
      expect(await response.text()).toEqual('');
    });

    it('should follow a 303 redirect with a GET', async () => {
      const response = await fetch(`${target.origin}/redirect-303`, {
        agent,
        method: 'POST',
        headers: {'content-type': 'text/plain'},
        body: 'data',
      });
      expect(response.status).toEqual(201);
      expect(response.url).toEqual(`${target.origin}/json`);
      expect(target.requests.map(r => `${r.method} ${r.url}`)).toEqual([
        'POST /redirect-303',
        'GET /json',
      ]);
      expect(target.requests[1].headers).not.toHaveProperty('content-type');
    });

    it('should preserve the method and body on a 307 redirect', async () => {
      const response = await fetch(`${target.origin}/redirect-307`, {
        agent,
        method: 'PUT',
        body: 'data',
      });
      expect(await response.text()).toEqual('ok');
      expect(target.requests[1]).toMatchObject({method: 'PUT', url: '/echo', body: 'data'});
    });

    it('should not follow redirects in manual mode', async () => {
      const response = await fetch(`${target.origin}/redirect-303`, {agent, redirect: 'manual'});
      expect(response.status).toEqual(303);
      expect(response.headers.get('location')).toEqual('/json');
    });

    it('should reject on redirects in error mode', async () => {
      await expect(
        fetch(`${target.origin}/redirect-303`, {agent, redirect: 'error'})
      ).rejects.toThrow(/unexpected redirect/);
    });

    it('should reject on too many redirects', async () => {
      await expect(fetch(`${target.origin}/redirect-loop`, {agent})).rejects.toThrow(
        /maximum redirect count/
      );
    });

    it('should reject on network errors', async () => {
      await closeServer(target.server);
      await expect(fetch(`${target.origin}/json`, {agent})).rejects.toThrow();
      target = await startServer((req, res) => res.end());
    });
  });

  describe('with proxy env vars', () => {
    it('should route requests through the HTTP_PROXY', async () => {
      const proxy = await startServer((req, res) => {
        res.end('proxied');
      });

      try {
        process.env.HTTP_PROXY = proxy.origin;
        for (const name of ['NO_PROXY', 'no_proxy', 'npm_config_no_proxy', 'http_proxy']) {
          delete process.env[name];
        }
        const response = await fetch('http://lhci-proxy-test.example/some/path?q=1', {
          headers: {'x-test': '1'},
        });
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('proxied');
        expect(proxy.requests).toHaveLength(1);
        // An HTTP proxy receives the absolute target URL as the request target.
        expect(proxy.requests[0].url).toEqual('http://lhci-proxy-test.example/some/path?q=1');
        expect(proxy.requests[0].headers).toMatchObject({
          host: 'lhci-proxy-test.example',
          'x-test': '1',
        });
      } finally {
        await closeServer(proxy.server);
      }
    });
  });
});
