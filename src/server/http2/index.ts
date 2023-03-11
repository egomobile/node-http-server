/* eslint-disable spaced-comment */

// This file is part of the @egomobile/http-server distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-server is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-server is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { Http2Server, Http2ServerRequest, SecureServerOptions, ServerOptions, Http2ServerResponse as _Http2ServerResponse, createSecureServer, createServer } from "node:http2";

import type { RequestErrorHandler } from "../../errors/index.js";
import { httpMethods } from "../../index.js";
import type { HttpMethod, HttpMiddleware, HttpNotFoundHandler, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpServer, IHttpServerExtenderContext } from "../../types/index.js";
import type { IHttpRequestHandlerContext, Nilable, Optional } from "../../types/internal.js";
import { asAsync, getUrlWithoutQuery, isDev, isNil, recompileHandlers } from "../../utils/internal.js";

/**
 * Options for `createHttp2Server()` function.
 */
export type CreateHttp2ServerOptions =
    ICreateSecrureHttp2ServerOptions |
    ICreateUnsecrureHttp2ServerOptions;

/**
 * Shortcur for a HTTP 1 middleware.
 */
export type Http2Middleware = HttpMiddleware<Http2ServerRequest, Http2ServerResponse>;

/**
 * Shortcut type for a HTTP 2 'not found' handler.
 */
export type Http2NotFoundHandler = HttpNotFoundHandler<Http2ServerRequest, Http2ServerResponse>;

/**
 * An extended version of `_Http2ServerResponse`.
 */
export type Http2ServerResponse = _Http2ServerResponse & {
    params?: Record<string, string>;
};

/**
 * Shortcut type for a HTTP 2 extender context.
 */
export type Http2ServerExtenderContext = IHttpServerExtenderContext<Http2ServerRequest, Http2ServerResponse>;

/**
 * Shortcut type for a HTTP 2 request handler.
 */
export type Http2RequestErrorHandler = RequestErrorHandler<Http2ServerRequest, Http2ServerResponse>;

/**
 * Shortcut for a HTTP 2 request handler.
 */
export type Http2RequestHandler = HttpRequestHandler<Http2ServerRequest, Http2ServerResponse>;

type Http2RequestHandlerContext = IHttpRequestHandlerContext<Http2ServerRequest, Http2ServerResponse>;

/**
 * Options for `createHttp2Server()` function, creating a secure instance.
 */
export interface ICreateSecrureHttp2ServerOptions {
    /**
     * The options for the underlying instance.
     */
    instanceOptions?: Nilable<SecureServerOptions>;
    /**
     * Indicates to create a secure instance.
     */
    secure?: Nilable<true>;
}

/**
 * Options for `createHttp2Server()` function, creating an unsecure instance.
 */
export interface ICreateUnsecrureHttp2ServerOptions {
    /**
     * The options for the underlying instance.
     */
    instanceOptions?: Nilable<ServerOptions>;
    /**
     * Indicates to create a secure instance.
     */
    secure: false;
}

/**
 * A HTTP 2.x server instance.
 */
export interface IHttp2Server extends IHttpServer<Http2ServerRequest, Http2ServerResponse> {
    /**
     * @inheritdoc
     */
    readonly instance: Optional<Http2Server>;
}

/**
 * A default HTTP 2 request error handler.
 *
 * @param {any} error The error,
 * @param {Http2ServerRequest} request The request context.
 * @param {Http2ServerResponse} response The response context.
 */
export const defaultHttp2RequestErrorHandler: Http2RequestErrorHandler =
    isDev() ?
        async (error, request, response) => {
            const errorMessage = Buffer.from(
                String(error)
            );

            if (!response.headersSent) {
                response.writeHead(500, {
                    "Content-Length": errorMessage.length,
                    "Content-Type": "text/plain; charset=UTF-8"
                });
            }

            response.end(errorMessage);
        } :
        async (error, request, response) => {
            if (!response.headersSent) {
                response.writeHead(500, {
                    "Content-Length": 0,
                    "Content-Type": "text/plain; charset=UTF-8"
                });
            }

            response.end();
        };

/**
 * A default HTTP 1 request error handler.
 *
 * @param {Http2ServerRequest} request The request context.
 * @param {Http2ServerResponse} response The response context.
 */
export const defaultHttp2NotFoundHandler: Http2NotFoundHandler =
    async (request, response) => {
        const errorMessage = Buffer.from(
            `[${request.method}] ${request.url} not found`
        );

        if (!response.headersSent) {
            response.writeHead(404, {
                "Content-Length": errorMessage.length,
                "Content-Type": "text/plain; charset=UTF-8"
            });
        }

        response.end(errorMessage);
    };

/**
 * Creates a new instance of an `IHttp2Server` server.
 *
 * @param {Nilable<CreateHttp2ServerOptions>} options The custom options.
 *
 * @returns {Promise<IHttp2Server>} The promise with the new instance.
 */
export async function createHttp2Server(options: Nilable<CreateHttp2ServerOptions>): Promise<IHttp2Server> {
    if (!isNil(options)) {
        if (typeof options !== "object") {
            throw new TypeError("options must be of type object");
        }
    }

    const compiledHandlers: Partial<Record<Uppercase<HttpMethod>, Http2RequestHandlerContext[]>> = {};
    let errorHandler = defaultHttp2RequestErrorHandler;
    const globalMiddlewares: Http2Middleware[] = [];
    let instance: Optional<Http2Server>;
    let notFoundHandler = defaultHttp2NotFoundHandler;
    let port: Optional<number>;

    // define server instance as request handler for
    // a `Http2Server` instance first
    const server = (async (request: Http2ServerRequest, response: Http2ServerResponse) => {
        try {
            let ctx: Nilable<Http2RequestHandlerContext>;

            const methodContextes = compiledHandlers[request.method as Uppercase<HttpMethod>];
            if (methodContextes) {
                for (const context of methodContextes) {
                    const isValid = await context.isPathValid(request);

                    if (isValid) {
                        ctx = context;
                        break;
                    }
                }
            }

            if (ctx) {
                await ctx.handler(request, response);

                await ctx.end(response);
            }
            else {
                notFoundHandler(request, response)
                    .then(() => {
                        response.end();
                    })
                    .catch((ex: any) => {
                        console.error("[HTTP2 NOT FOUND HANDLER]", ex);

                        response.end();
                    });
            }
        }
        catch (error) {
            errorHandler(error, request, response)
                .then(() => {
                    response.end();
                })
                .catch((ex: any) => {
                    console.error("[HTTP2 ERROR HANDLER]", ex);

                    response.end();
                });
        }
    }) as unknown as IHttp2Server;

    // server.extend()
    server.extend = (extender) => {
        if (typeof extender !== "function") {
            throw new TypeError("extender must be of type function");
        }

        const context: Http2ServerExtenderContext = {
            server
        };

        extender(context);
    };

    // server.setErrorHandler()
    server.setErrorHandler = (handler) => {
        if (typeof handler !== "function") {
            throw new TypeError("handler must be of type function");
        }

        errorHandler = asAsync(handler);
    };

    // server.setNotFoundHandler()
    server.setNotFoundHandler = (handler) => {
        if (typeof handler !== "function") {
            throw new TypeError("handler must be of type function");
        }

        notFoundHandler = asAsync(handler);
    };

    // methods for
    // `connect`, `delete`, `get`, `head`, `options`, `patch`, `post`, `put`, `trace`
    httpMethods.forEach((httpMethod) => {
        const ucHttpMethod = httpMethod.toUpperCase() as Uppercase<HttpMethod>;

        (server as any)[httpMethod] = (pathOrValidator: HttpRequestPath<Http2ServerRequest>, ...args: any[]) => {
            let handler: HttpRequestHandler<Http2ServerRequest, Http2ServerResponse>;
            let isPathValid: HttpPathValidator<Http2ServerRequest>;
            let middlewares: Http2Middleware[];

            if (typeof pathOrValidator === "string") {
                isPathValid = async (request) => {
                    return getUrlWithoutQuery(request.url) === pathOrValidator;
                };
            }
            else if (pathOrValidator instanceof RegExp) {
                isPathValid = async (request) => {
                    return pathOrValidator.test(getUrlWithoutQuery(request.url));
                };
            }
            else {
                isPathValid = asAsync(pathOrValidator);
            }

            if (Array.isArray(args[0])) {
                // args[1]: HttpMiddleware<Http2ServerRequest, Http2ServerResponse>[]
                // args[2]: HttpRequestHandler<Http2ServerRequest, Http2ServerResponse>

                middlewares = args[0];
                handler = args[1];
            }
            else {
                // args[1]: HttpRequestHandler<Http2ServerRequest, Http2ServerResponse>

                middlewares = [];
                handler = args[0];
            }

            if (typeof handler !== "function") {
                throw new TypeError("handler must be of type function");
            }

            if (typeof isPathValid !== "function") {
                throw new TypeError("pathOrValidator must be of type string, RegExp or function");
            }

            let handlers: Optional<Http2RequestHandlerContext[]> = compiledHandlers[ucHttpMethod];
            if (!handlers) {
                handlers = compiledHandlers[ucHttpMethod] = [];
            }

            handlers.push({
                "baseHandler": handler,
                "end": async (response) => {
                    response.end();
                },
                isPathValid,
                middlewares,
                handler
            });

            recompileHandlers(
                compiledHandlers,
                globalMiddlewares
            );
        };
    });

    // server.use()
    server.use = (...middlewares) => {
        if (middlewares.some((mw) => {
            return typeof mw !== "function";
        })) {
            throw new TypeError("All items in middlewares must be of type function");
        }

        globalMiddlewares.push(...middlewares);
    };

    // server.listen()
    server.listen = (p) => {
        return new Promise<number>((resolve, reject) => {
            let tcpPort: number;
            if (isNil(p)) {
                tcpPort = isDev() ? 8080 : 80;
            }
            else {
                if (typeof p === "number") {
                    tcpPort = p;
                }
                else {
                    tcpPort = parseInt(p);
                }
            }

            if (Number.isNaN(tcpPort)) {
                return reject(new TypeError("port must be a valid number"));
            }
            if (tcpPort < 0 || tcpPort > 65535) {
                return reject("port must be a valid number between 0 and 65535");
            }

            if (typeof port === "number") {
                return reject(`Server is current running on port ${port}`);
            }

            let newInstance: Http2Server;
            if (options?.secure !== false) {
                if (isNil(options?.instanceOptions)) {
                    newInstance = createSecureServer(server);
                }
                else {
                    newInstance = createSecureServer(options?.instanceOptions as SecureServerOptions, server);
                }
            }
            else {
                if (isNil(options?.instanceOptions)) {
                    newInstance = createServer(server);
                }
                else {
                    newInstance = createServer(options?.instanceOptions as ServerOptions, server);
                }
            }

            newInstance.once("error", reject);

            newInstance.listen(tcpPort, () => {
                instance = newInstance;
                port = tcpPort;

                return resolve(tcpPort);
            });
        });
    };

    return Object.defineProperties(server, {
        "instance": {
            "enumerable": true,
            "configurable": false,
            "get": () => {
                return instance;
            }
        },
        "port": {
            "enumerable": true,
            "configurable": false,
            "get": () => {
                return port;
            }
        }
    });
}
