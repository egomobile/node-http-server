[![npm](https://img.shields.io/npm/v/@egomobile/http-server.svg)](https://www.npmjs.com/package/@egomobile/http-server)
[![last build](https://img.shields.io/github/workflow/status/egomobile/node-http-server/Publish)](https://github.com/egomobile/node-http-server/actions?query=workflow%3APublish)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/node-http-server/pulls)

# @egomobile/http-server

> Very fast alternative HTTP server to [Express](http://expressjs.com/), with
> simple routing and middleware support and which ist compatible with
> [Node.js 12](https://nodejs.org/en/blog/release/v12.0.0/) or later.

## Install

Execute the following command from your project folder, where your
`package.json` file is stored:

```bash
npm install --save @egomobile/http-server
```

## Usage

### Quick example

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
  app.get("/foo", [query()] async (request, response) => {
    response.write(" BAR: " + request.query!.bar);
    response.write(" BAZ: " + request.query!.baz);
  });

  await app.listen();
  console.log(`Server now running on port ${app.port} ...`);
}

main().catch(console.error);
```

### Middlewares

To enhance the functionality of your handlers, you can setup global or route
specific middlewares.

For more details, have a look
[at the wiki page](https://github.com/egomobile/node-http-server/wiki/Middlewares).

### Controllers

The module provides tools, like
[decorators](https://www.typescriptlang.org/docs/handbook/decorators.html),
[functions](https://www.typescriptlang.org/docs/handbook/functions.html) and
[classes](https://www.typescriptlang.org/docs/handbook/classes.html), that helps
to setup routes and their behavior on a quite simple and high level.

Have a look
[at the wiki page](https://github.com/egomobile/node-http-server/wiki/Controllers)
for detailed information.

### Error handling

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

#### Pretty error pages

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

## Credits

The module makes use of:

- [joi](https://joi.dev/) by [Sideway Inc.](https://github.com/sideway)
- [mime-types](https://github.com/jshttp/mime-types) by
  [jshttp](https://github.com/jshttp)
- [minimatch](https://github.com/isaacs/minimatch) by
  [isaacs](https://github.com/isaacs)
- [regexparam](https://github.com/lukeed/regexparam) by
  [Luke Edwards](https://github.com/lukeed)
- [Swagger UI](https://github.com/swagger-api/swagger-ui) and
  [openapi-types](https://github.com/kogosoftwarellc/open-api)
- [Youch!](https://github.com/poppinss/youch) by
  [Poppinss](https://github.com/poppinss)

## Documentation

The API documentation can be found
[here](https://egomobile.github.io/node-http-server/).
