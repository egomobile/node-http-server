[![npm](https://img.shields.io/npm/v/@egomobile/http-server.svg)](https://www.npmjs.com/package/@egomobile/http-server) [![last build](https://img.shields.io/github/workflow/status/egomobile/http-server/Publish)](https://github.com/egomobile/http-server/actions?query=workflow%3APublish) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/http-server/pulls)

# @egomobile/http-server

> Very fast alternative HTTP server to [Express](http://expressjs.com/), with simple routing and middleware support and which ist compatible with [Node.js 12](https://nodejs.org/en/blog/release/v12.0.0/) or later.

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save @egomobile/http-server
```

## Usage

### Quick example

```typescript
import createServer, { buffer } from "@egomobile/http-server";

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

  await app.listen();
  console.log(`Server now running on port ${app.port} ...`);
}

main().catch(console.error);
```

### Middlewares

#### buffer()

```typescript
import createServer, { buffer } from "@egomobile/http-server";

async function main() {
  // ...

  // loads the whole request and writes it
  // to 'body' prop of 'request' object
  // with a custom limit of 256 MB
  app.put("/", [buffer(256)], async (request, response) => {
    response.write("Hello: " + request.body!.toString("ascii"));
  });

  // ...
}

main().catch(console.error);
```

#### json()

```typescript
import createServer, { json } from "@egomobile/http-server";

async function main() {
  // ...

  // loads the whole request, parses the content as UTF-8 JSON
  // string and writes it to 'body' prop of 'request' object
  // with a default limit of 1284 MB
  app.put("/", [json()], async (request, response) => {
    response.write("Hello: " + request.body!.toString("ascii"));
  });

  // ...
}

main().catch(console.error);
```

#### 3rd party modules

```typescript
import cors from "cors"; // npm i cors && npm i -D @types/cors
import createServer from "@egomobile/http-server";

async function main() {
  // ...

  app.use(cors());

  app.get("/", async (request, response) => {
    // your code
  });

  // ...
}

main().catch(console.error);
```

#### Custom middlewares

```typescript
import createServer from "@egomobile/http-server";

async function main() {
  // ...

  // global middlewares
  app.use(
    async (request: any, response, next) => {
      request.foo = "1";
    },
    async (request: any, response, next) => {
      request.foo += "a";
    }
  );

  app.patch(
    "/",
    // route specific middlewares
    [
      async (request: any, response, next) => {
        request.foo += 2;
      },
      async (request: any, response, next) => {
        request.foo += 3;
      },
    ],
    async (request: any, response) => {
      // request.foo === '1a23'
    }
  );

  // ...
}

main().catch(console.error);
```

## Error handling

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

## Documentation

The API documentation can be found [here](https://egomobile.github.io/http-server/).
