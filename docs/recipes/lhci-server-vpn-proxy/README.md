
# nginx-based LHCI Proxy Server

**NOTE: be sure to read the [Security section](../../server.md#Security) of the server documentation to protect your server properly**

## Overview

This assumes some knowledge of Docker/K8 (see [docker recipe](../docker-server)), VPN remote access, and [nginx config](https://www.nginx.com/resources/wiki/start/topics/examples/full/). It's not uncommon that a company develops internal tools behind VPN, but if you want to intentionally expose an internal service, like LHCI, you typically use [a proxy pattern](https://en.wikipedia.org/wiki/Proxy_pattern).

This is a contrived recipe on how to configure a nginx reverse proxy to expose parts of your LHCI server that exists behind a VPN.

## Architecture

Say you build a custom LHCI server behind your company's VPN:
```
|-----VPN-----|
| LHCI server | X-- www <-- client ¯\_(⊙︿⊙)_/¯
|             |
|-------------|
```
You hand out VPN profiles to employees to access this private LHCI server at `https://lhc-over-vpn.example.com` and you see the LHCI server GUI in all its glory:
```
|-----VPN-----|
| LHCI server | <-- VPN tunnel <-- www <-- remote access client ヽ(´ー｀)ノ
|             |
|-------------|
```
### Problem

That works when viewing the GUI with a browser at `https://lhc-over-vpn.example.com`, but what happens when you need to provide access for public-facing CI tools to upload reports to your private LHCI server? For example, CI tools like [CircleCI](https://circleci.com/blog/vpns-and-why-they-don-t-work/) and [TravisCI](https://docs.travis-ci.com/user/common-build-problems/#ftpsmtpother-protocol-do-not-work) have limitations in dealing with VPN tunneling or else you are stuck with extremely complicated docker setup using `ssh` and `openvpn`. It's definitely not supported out of the box and doesn't work at all with VPN + MFA.

### A Proxy Solution

So you use a CI tool like CircleCI and want to allow uploading reports to your private LHCI server. One solution might be to use a nginx reverse proxy server to [expose only certain routes](https://github.com/GoogleChrome/lighthouse-ci/blob/v0.4.1/packages/server/src/server.js#L51) for your CI tool to communicate with your LHCI server.

⚠️ It is recommended you at least password-protect using [LHCI basic auth](../../server.md#basic-authentication), since you will be exposing these routes to the public.

So at the gateway of your company's VPN, you might have a nginx server where you can reverse proxy to your private LHCI server:
```
|-----VPN-----|
| LHCI server | <-- VPN tunnel <-- lhc-over-vpn.example.com/app/projects <-- remote access client
|             |
|             | <-- upload <-- (lhc-over-vpn.example.com/v1/projects) <-- www.public-proxy.example.com/lighthouse/v1/projects <-- CircleCI
|-------------|
```

With this setup, the GUI at `lhc-over-vpn.example.com/app/projects` is left intact behind the VPN, but external CI tools now have public access to the exposed, but still password-protected, reverse proxy server (`www.public-proxy.example.com/lighthouse/v1`)!
