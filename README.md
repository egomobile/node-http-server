[![npm](https://img.shields.io/npm/v/@egomobile/http-server.svg)](https://www.npmjs.com/package/@egomobile/http-server)
[![last build](https://img.shields.io/github/workflow/status/egomobile/node-http-server/Publish)](https://github.com/egomobile/node-http-server/actions?query=workflow%3APublish)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/node-http-server/pulls)

# @egomobile/http-server

> Very fast alternative HTTP server to [Express](http://expressjs.com/), with
> simple routing and middleware support and which is compatible with
> [Node.js 12](https://nodejs.org/en/blog/release/v12.0.0/) or later.

<a name="toc"></a>

## Table of contents

- [Install](#install)
- [Usage](#usage)
  - [Quick example](#quick-example)
  - [Middlewares](#middlewares)
  - [Controllers](#controllers)
  - [Error handling](#error-handling)
    - [Pretty error pages](#pretty-error-pages)
- [Benchmarks](#benchmarks)
- [Credits](#credits)
- [Documentation](#documentation)
- [See also](#see-also)

<a name="install"></a>

## Install [<a href="#toc">↑</a>]

Execute the following command from your project folder, where your
`package.json` file is stored:

```bash
npm install --save @egomobile/http-server
```

<a name="usage"></a>

## Usage [<a href="#toc">↑</a>]

<a name="quick-example"></a>

### Quick example [<a href="#usage">↑</a>]

```typescript
import createServer, { buffer, params, query } from "@egomobile/http-server";

async function main() {
  const app = createServer();

  // POST request for / route
  // that uses the middleware buffer(), which loads the
  // whole request body with a limit of 128 MB by default
  // and writes the data to 'body' prop of 'request' object
  // as Buffer
  app.post("/", [buffer()], async (request, response) => {
    const name: string = request.body!.toString("utf8");

    response.write("Hello: " + name);
    // no response.end() is required here
  });

  // parameters require a special path validator here
  // s. https://github.com/lukeed/regexparam
  // for more information about the string format
  app.get(params("/foo/:bar/baz"), async (request, response) => {
    response.write("BAR: " + request.params!.bar);
  });

  // parse query parameters from URL
  // and write them to 'query' prop of 'request' object
  app.get("/foo", [query()], async (request, response) => {
    // request.query => https://nodejs.org/api/url.html#class-urlsearchparams

    response.write(" BAR: " + request.query!.get("bar"));
    response.write(" BAZ: " + request.query!.get("baz"));
  });

  await app.listen();
  console.log(`Server now running on port ${app.port} ...`);
}

main().catch(console.error);
```

<a name="middlewares"></a>

### Middlewares [<a href="#usage">↑</a>]

To enhance the functionality of your handlers, you can setup global or route
specific middlewares.

For more details, have a look
[at the wiki page](https://github.com/egomobile/node-http-server/wiki/Middlewares).

<a name="controllers"></a>

### Controllers [<a href="#usage">↑</a>]

The module provides tools, like
[decorators](https://www.typescriptlang.org/docs/handbook/decorators.html),
[functions](https://www.typescriptlang.org/docs/handbook/functions.html) and
[classes](https://www.typescriptlang.org/docs/handbook/classes.html), that helps
to setup routes and their behavior on a quite simple and high level.

Have a look
[at the wiki page](https://github.com/egomobile/node-http-server/wiki/Controllers)
for detailed information.

<a name="error-handling"></a>

### Error handling [<a href="#usage">↑</a>]

```typescript
import createServer from "@egomobile/http-server";

async function main() {
  // ...

  // custom error handler
  app.setErrorHandler(async (error, request, response) => {
    const errorMessage = Buffer.from("SERVER ERROR: " + String(error), "utf8");

    if (!response.headersSend) {
      response.writeHead(400, {
        "Content-Length": String(errorMessage.length),
      });
    }

    response.write(errorMessage);
    response.end();
  });

  // custom 404 handler
  app.setNotFoundHandler(async (request, response) => {
    const notFoundMessage = Buffer.from(`${request.url} not found!`, "utf8");

    if (!response.headersSend) {
      response.writeHead(404, {
        "Content-Length": String(notFoundMessage.length),
      });
    }

    response.write(notFoundMessage);
    response.end();
  });

  app.get("/", async (request, response) => {
    throw new Error("Something went wrong!");
  });

  // ...
}

main().catch(console.error);
```

<a name="pretty-error-pages"></a>

#### Pretty error pages [<a href="#error-handling">↑</a>]

```typescript
import createServer, { prettyErrors } from "@egomobile/http-server";

async function main() {
  // ...

  app.setErrorHandler(prettyErrors());

  app.get("/", async (request, response) => {
    throw new Error("Oops! Something went wrong!");
  });

  // ...
}

main().catch(console.error);
```

A possible result could be:

<kbd><img src="./assets/screenshot.png" /></kbd>

<a name="benchmarks"></a>

## Benchmarks [<a href="#toc">↑</a>]

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

[Here](./benchmarks/README.md) are more information, on how the benchmarks were recorded.

<a name="credits"></a>

## Credits [<a href="#toc">↑</a>]

The module makes use of:

- [joi](https://joi.dev/) by [Sideway Inc.](https://github.com/sideway)
- [js-yaml](https://github.com/nodeca/js-yaml) by
  [Nodeca](https://github.com/nodeca)
- [minimatch](https://github.com/isaacs/minimatch) by
  [isaacs](https://github.com/isaacs)
- [mrmime](https://github.com/lukeed/mrmime) by
  [Luke Edwards](https://github.com/lukeed)
- [regexparam](https://github.com/lukeed/regexparam) by
  [Luke Edwards](https://github.com/lukeed)
- [Swagger UI](https://github.com/swagger-api/swagger-ui) and
  [openapi-types](https://github.com/kogosoftwarellc/open-api)
- [Youch!](https://github.com/poppinss/youch) by
  [Poppinss](https://github.com/poppinss)

<a name="documentation"></a>

## Documentation [<a href="#toc">↑</a>]

The API documentation can be found
[here](https://egomobile.github.io/node-http-server/).

<a name="see-also"></a>

## See also [<a href="#toc">↑</a>]

- [@egomobile/api-utils](https://github.com/egomobile/node-api-utils) - Extensions for this module, helping realizing REST APIs
