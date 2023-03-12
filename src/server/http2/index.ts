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

import { createSecureServer, createServer, Http2Server, Http2ServerRequest, Http2ServerResponse, SecureServerOptions, ServerOptions } from "node:http2";

import type { RequestErrorHandler } from "../../errors/index.js";
import { httpMethods, params } from "../../index.js";
import type { HttpMethod, HttpMiddleware, HttpNotFoundHandler, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpRequest, IHttpRequestHandlerOptions, IHttpResponse, IHttpServer, IHttpServerExtenderContext } from "../../types/index.js";
import type { IHttpRequestHandlerContext, Nilable, Optional } from "../../types/internal.js";
import { asAsync, getUrlWithoutQuery, isDev, isNil } from "../../utils/internal.js";
import { recompileHandlers } from "../utils.js";

/**
 * Options for `createHttp2Server()` function.
 */
export type CreateHttp2ServerOptions =
    ICreateSecrureHttp2ServerOptions |
    ICreateUnsecrureHttp2ServerOptions;

/**
 * Shortcur for a HTTP 1 middleware.
 */
export type Http2Middleware = HttpMiddleware<IHttp2Request, IHttp2Response>;

/**
 * Shortcut type for a HTTP 2 'not found' handler.
 */
export type Http2NotFoundHandler = HttpNotFoundHandler<IHttp2Request, IHttp2Response>;

/**
 * Shortcut type for a HTTP 2 path validator.
 */
export type Http2PathValidator = HttpPathValidator<IHttp2Request>;

/**
 * Shortcut type for a HTTP 2 request handler options.
 */
export type Http2RequestHandlerOptions = IHttpRequestHandlerOptions<IHttp2Request, IHttp2Response>;

/**
 * Shortcut type for a HTTP 2 extender context.
 */
export type Http2ServerExtenderContext = IHttpServerExtenderContext<IHttp2Request, IHttp2Response>;

/**
 * Shortcut type for a HTTP 2 request handler.
 */
export type Http2RequestErrorHandler = RequestErrorHandler<IHttp2Request, IHttp2Response>;

/**
 * Shortcut for a HTTP 2 request handler.
 */
export type Http2RequestHandler = HttpRequestHandler<IHttp2Request, IHttp2Response>;

type Http2RequestHandlerContext = IHttpRequestHandlerContext<IHttp2Request, IHttp2Response>;

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
 * A HTTP 2 request context.
 */
export interface IHttp2Request extends Http2ServerRequest, IHttpRequest {
}

/**
 * A HTTP 2 response context.
 */
export interface IHttp2Response extends Http2ServerResponse, IHttpResponse {
}

/**
 * A HTTP 2.x server instance.
 */
export interface IHttp2Server extends IHttpServer<IHttp2Request, IHttp2Response> {
    /**
     * @inheritdoc
     */
    readonly httpVersion: 2;

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
 * @returns {IHttp2Server} The new instance.
 */
export function createHttp2Server(options: Nilable<CreateHttp2ServerOptions>): IHttp2Server {
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
    const server = (async (request: IHttp2Request, response: IHttp2Response) => {
        try {
            let ctx: Nilable<Http2RequestHandlerContext>;

            const methodContextes = compiledHandlers[request.method as Uppercase<HttpMethod>];
            const methodContextesLength = methodContextes?.length;

            if (methodContextesLength) {
                for (let i = 0; i < methodContextesLength; i++) {
                    const context = methodContextes[i];
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

        return server;
    };

    // server.setErrorHandler()
    server.setErrorHandler = (handler) => {
        if (typeof handler !== "function") {
            throw new TypeError("handler must be of type function");
        }

        errorHandler = asAsync(handler);

        return server;
    };

    // server.setNotFoundHandler()
    server.setNotFoundHandler = (handler) => {
        if (typeof handler !== "function") {
            throw new TypeError("handler must be of type function");
        }

        notFoundHandler = asAsync(handler);

        return server;
    };

    // methods for
    // `connect`, `delete`, `get`, `head`, `options`, `patch`, `post`, `put`, `trace`
    httpMethods.forEach((httpMethod) => {
        const ucHttpMethod = httpMethod.toUpperCase() as Uppercase<HttpMethod>;

        (server as any)[httpMethod] = (pathOrValidator: HttpRequestPath<IHttp2Request>, ...args: any[]) => {
            let options: Http2RequestHandlerOptions;
            let handler: Http2RequestHandler;
            let isPathValid: Http2PathValidator;

            if (args.length < 2) {
                // args[0]: Http2RequestHandler

                options = {};
                handler = args[0];
            }
            else {
                if (Array.isArray(args[0])) {
                    // args[0]: Http2Middleware[]
                    // args[1]: Http2RequestHandler

                    options = {
                        "use": args[0]
                    };
                    handler = args[1];
                }
                else {
                    // args[0]: Http2RequestHandlerOptions
                    // args[1]: Http2RequestHandler

                    options = args[0];
                    handler = args[1];
                }
            }

            const middlewares = options.use ?? [];
            const shouldNotDoAutoEnd = !!options.noAutoEnd;
            const shouldNotDoAutoParams = !!options.noAutoParams;

            if (typeof pathOrValidator === "string") {
                if (shouldNotDoAutoParams || !pathOrValidator.includes("/:")) {
                    isPathValid = async (request) => {
                        return getUrlWithoutQuery(request.url) === pathOrValidator;
                    };
                }
                else {
                    isPathValid = params(pathOrValidator);
                }
            }
            else if (pathOrValidator instanceof RegExp) {
                isPathValid = async (request) => {
                    return pathOrValidator.test(getUrlWithoutQuery(request.url));
                };
            }
            else {
                isPathValid = asAsync(pathOrValidator);
            }

            if (typeof handler !== "function") {
                throw new TypeError("handler must be of type function");
            }

            if (typeof isPathValid !== "function") {
                throw new TypeError("pathOrValidator must be of type string, RegExp or function");
            }

            if (!Array.isArray(middlewares)) {
                throw new TypeError("middlewares must be of type Array");
            }
            if (middlewares.some((mw) => {
                return typeof mw !== "function";
            })) {
                throw new TypeError("All items of middlewares must be of type function");
            }

            let handlers: Optional<Http2RequestHandlerContext[]> = compiledHandlers[ucHttpMethod];
            if (!handlers) {
                handlers = compiledHandlers[ucHttpMethod] = [];
            }

            handlers.push({
                "baseHandler": handler,
                "end": shouldNotDoAutoEnd ?
                    async () => { } :
                    async (response) => {
                        response.end();
                    },
                isPathValid,
                "middlewares": middlewares.map((mw) => {
                    return asAsync<Http2Middleware>(mw);
                }),
                handler
            });

            recompileHandlers(
                compiledHandlers,
                globalMiddlewares
            );

            return server;
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

        return server;
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
        "httpVersion": {
            "enumerable": true,
            "configurable": false,
            "get": () => {
                return 2;
            }
        },
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
