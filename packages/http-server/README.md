[![npm](https://img.shields.io/npm/v/@egomobile/http-server.svg)](https://www.npmjs.com/package/@egomobile/http-server)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/node-http-server/pulls)

# @egomobile/http-server

> Very fast alternative HTTP server to [Express](http://expressjs.com/), with
> simple routing and middleware support and which is compatible with
> [Node.js 18](https://nodejs.org/en/blog/release/v18.0.0/) or later.

<a name="toc"></a>

## Table of contents

- [Install](#install)
- [Usage](#usage)
  - [Quick example](#quick-example)
- [Benchmarks](#benchmarks)
- [Credits](#credits)

<a name="install"></a>

## Install [<a href="#toc">↑</a>]

Execute the following command from your project folder, where your
`package.json` file is stored:

```bash
npm install --save @egomobile/http-server@alpha
```

<a name="usage"></a>

## Usage [<a href="#toc">↑</a>]

<a name="quick-example"></a>

### Quick example [<a href="#usage">↑</a>]

```typescript
import { createServer, query } from "@egomobile/http-server";

// creates a new HTTP 1 server
const app = createServer({
  // will deactivate automatic parsing of query parameters
  // this should make it faster, but requires
  // `query()` middleware in every handler, where it is needed
  noAutoQuery: true,
});

// POST request for / route
app.post("/", async (request, response) => {
  response.write("Hello from POST");

  // no response.end() required by default
});

// an example with parameter `bar`
// s. https://github.com/lukeed/regexparam
// for more information about the string format
app.get("/foo/:bar/baz", async (request, response) => {
  response.write("BAR: " + request.params!.bar);
});

// parse query parameters from URL by middleware
// and write them to `query` prop of `request` object
app.get("/foo", [query()], async (request, response) => {
  // request.query => https://nodejs.org/api/url.html#class-urlsearchparams

  response.write(" BAR: " + request.query!.get("bar"));
  response.write(" BAZ: " + request.query!.get("baz"));
});

app.listen().then((port) => {
  console.log(`Server now running on port ${port}`);
});
```

<a name="benchmarks"></a>

## Benchmarks [<a href="#toc">↑</a>]

| &nbsp;                   |  `Express`  | `fastify` | `polka` | `@egomobile/http-server` |
| ------------------------ | :---------: | :-------: | :-----: | :----------------------: |
| `Express`                |      -      |    93%    |   39%   |          30% 🐌          |
| `fastify`                |    107%     |     -     |   43%   |          32% 🐢          |
| `polka`                  |    256%     |   238%    |    -    |          76% 🐇          |
| `@egomobile/http-server` | 337% 🚀🚀🚀 | 314% 🚀🚀 | 132% 🚀 |            -             |

The following benchmarks were made with [wrk](https://github.com/wg/wrk) on the following machine, running [Node v16.13.2](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V16.md#16.13.2):

Machine:

- MacBook Pro (16", 2021)
- CPU: Apple M1 Max
- Memory: 64 GB
- OS: MacOS 12.1

Command: `wrk -t8 -c100 -d30s http://localhost:3000/user/123`

```
Express:
=============
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.56ms  674.79us  14.59ms   90.47%
    Req/Sec     3.39k   224.41     5.11k    75.04%
  809164 requests in 30.03s, 118.84MB read
Requests/sec:  26947.30
Transfer/sec:      3.96MB


Fastify:
=============
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.32ms    0.95ms  19.41ms   85.25%
    Req/Sec     3.64k   280.76     4.87k    76.38%
  869871 requests in 30.03s, 142.69MB read
Requests/sec:  28971.44
Transfer/sec:      4.75MB


Polka:
===========
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.39ms  289.29us  13.20ms   91.15%
    Req/Sec     8.66k     1.26k   10.67k    59.55%
  2074873 requests in 30.10s, 259.22MB read
Requests/sec:  68930.81
Transfer/sec:      8.61MB


@egomobile/http-server:
============================
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.05ms  220.64us  13.11ms   85.16%
    Req/Sec    11.44k     1.39k   18.48k    81.16%
  2737095 requests in 30.10s, 341.95MB read
Requests/sec:  90922.13
Transfer/sec:     11.36MB
```

[Here](./benchmarks) is the test code, used recording the benchmarks.

<a name="credits"></a>

## Credits [<a href="#toc">↑</a>]

The module makes use of:

- [regexparam](https://github.com/lukeed/regexparam) by
  [Luke Edwards](https://github.com/lukeed)
