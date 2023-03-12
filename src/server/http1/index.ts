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

import { createServer, IncomingMessage, Server, ServerOptions, ServerResponse } from "node:http";
import { createServer as createSecureServer, ServerOptions as SecureServerOptions } from "node:https";

import type { RequestErrorHandler } from "../../errors/index.js";
import { httpMethods, params } from "../../index.js";
import type { HttpMethod, HttpMiddleware, HttpNotFoundHandler, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpRequest, IHttpRequestHandlerOptions, IHttpResponse, IHttpServer, IHttpServerExtenderContext } from "../../types/index.js";
import type { IHttpRequestHandlerContext, Nilable, Optional } from "../../types/internal.js";
import { asAsync, getUrlWithoutQuery, isDev, isNil } from "../../utils/internal.js";
import { recompileHandlers } from "../utils.js";

/**
 * Options for `createHttp1Server()` function.
 */
export type CreateHttp1ServerOptions =
    ICreateSecrureHttp1ServerOptions |
    ICreateUnsecrureHttp1ServerOptions;

/**
 * Shortcur for a HTTP 1 middleware.
 */
export type Http1Middleware = HttpMiddleware<IHttp1Request, IHttp1Response>;

/**
 * Shortcut type for a HTTP 1 'not found' handler.
 */
export type Http1NotFoundHandler = HttpNotFoundHandler<IHttp1Request, IHttp1Response>;

/**
 * Shortcut type for a HTTP 1 path validator.
 */
export type Http1PathValidator = HttpPathValidator<IHttp1Request>;

/**
 * Shortcut type for a HTTP 1 request handler.
 */
export type Http1RequestErrorHandler = RequestErrorHandler<IHttp1Request, IHttp1Response>;

/**
 * Shortcut type for a HTTP 1 request handler options.
 */
export type Http1RequestHandlerOptions = IHttpRequestHandlerOptions<IHttp1Request, IHttp1Response>;

/**
 * Shortcut type for a HTTP 1 request path.
 */
export type Http1RequestPath = HttpRequestPath<IHttp1Request>;

/**
 * Shortcut type for a HTTP 1 extender context.
 */
export type Http1ServerExtenderContext = IHttpServerExtenderContext<IHttp1Request, IHttp1Response>;

/**
 * Shortcut for a HTTP 1 request handler.
 */
export type Http1RequestHandler = HttpRequestHandler<IHttp1Request, IHttp1Response>;

type Http1RequestHandlerContext = IHttpRequestHandlerContext<IHttp1Request, IHttp1Response>;

/**
 * Options for `createHttp1Server()` function, creating a secure instance.
 */
export interface ICreateSecrureHttp1ServerOptions {
    /**
     * The options for the underlying instance.
     */
    instanceOptions?: Nilable<SecureServerOptions>;

    /**
     * Indicates to create a secure instance.
     */
    secure: true;
}

/**
 * Options for `createHttp1Server()` function, creating an unsecure instance.
 */
export interface ICreateUnsecrureHttp1ServerOptions {
    /**
     * The options for the underlying instance.
     */
    instanceOptions?: Nilable<ServerOptions>;

    /**
     * Indicates to create a secure instance.
     */
    secure?: Nilable<false>;
}

/**
 * A HTTP 1 request context.
 */
export interface IHttp1Request extends IncomingMessage, IHttpRequest {
}

/**
 * A HTTP 1 response context.
 */
export interface IHttp1Response extends ServerResponse, IHttpResponse {
}

/**
 * A HTTP 1.x server instance.
 */
export interface IHttp1Server extends IHttpServer<IHttp1Request, IHttp1Response> {
    /**
     * @inheritdoc
     */
    readonly httpVersion: 1;

    /**
     * @inheritdoc
     */
    readonly instance: Optional<Server>;
}

/**
 * A default HTTP 1 request error handler.
 *
 * @param {any} error The error,
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export const defaultHttp1RequestErrorHandler: Http1RequestErrorHandler =
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
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export const defaultHttp1NotFoundHandler: Http1NotFoundHandler =
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
 * Creates a new instance of an `IHttp1Server` server.
 *
 * @param {Nilable<CreateHttp1ServerOptions>} [options] The custom options.
 *
 * @returns {IHttp1Server} The new instance.
 */
export function createHttp1Server(options?: Nilable<CreateHttp1ServerOptions>): IHttp1Server {
    if (!isNil(options)) {
        if (typeof options !== "object") {
            throw new TypeError("options must be of type object");
        }
    }

    const compiledHandlers: Partial<Record<Uppercase<HttpMethod>, Http1RequestHandlerContext[]>> = {};
    let errorHandler = defaultHttp1RequestErrorHandler;
    const globalMiddlewares: Http1Middleware[] = [];
    let instance: Optional<Server>;
    let notFoundHandler = defaultHttp1NotFoundHandler;
    let port: Optional<number>;

    // define server instance as request handler for
    // a `Server` instance first
    const server = (async (request: IHttp1Request, response: IHttp1Response) => {
        try {
            let ctx: Nilable<Http1RequestHandlerContext>;

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
    }) as unknown as IHttp1Server;

    // server.extend()
    server.extend = (extender) => {
        if (typeof extender !== "function") {
            throw new TypeError("extender must be of type function");
        }

        const context: Http1ServerExtenderContext = {
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

        (server as any)[httpMethod] = (pathOrValidator: Http1RequestPath, ...args: any[]) => {
            let options: Http1RequestHandlerOptions;
            let handler: Http1RequestHandler;
            let isPathValid: Http1PathValidator;

            if (args.length < 2) {
                // args[0]: Http1RequestHandler

                options = {};
                handler = args[0];
            }
            else {
                if (Array.isArray(args[0])) {
                    // args[0]: Http1Middleware[]
                    // args[1]: Http1RequestHandler

                    options = {
                        "use": args[0]
                    };
                    handler = args[1];
                }
                else {
                    // args[0]: Http1RequestHandlerOptions
                    // args[1]: Http1RequestHandler

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

            let handlers: Optional<Http1RequestHandlerContext[]> = compiledHandlers[ucHttpMethod];
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
                    return asAsync<Http1Middleware>(mw);
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

            let newInstance: Server;
            if (options?.secure !== true) {
                if (isNil(options?.instanceOptions)) {
                    newInstance = createServer(server);
                }
                else {
                    newInstance = createServer(options?.instanceOptions as ServerOptions, server);
                }
            }
            else {
                if (isNil(options?.instanceOptions)) {
                    newInstance = createSecureServer(server);
                }
                else {
                    newInstance = createSecureServer(options?.instanceOptions as SecureServerOptions, server);
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
                return 1;
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
