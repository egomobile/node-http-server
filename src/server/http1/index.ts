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
import { httpMethods } from "../../index.js";
import type { HttpMethod, HttpMiddleware, HttpNotFoundHandler, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpServer, IHttpServerExtenderContext } from "../../types/index.js";
import type { IHttpRequestHandlerContext, Nilable, Optional } from "../../types/internal.js";
import { asAsync, getUrlWithoutQuery, isDev, isNil, recompileHandlers } from "../../utils/internal.js";

/**
 * Options for `createHttp1Server()` function.
 */
export type CreateHttp1ServerOptions =
    ICreateSecrureHttp1ServerOptions |
    ICreateUnsecrureHttp1ServerOptions;

/**
 * Shortcur for a HTTP 1 middleware.
 */
export type Http1Middleware = HttpMiddleware<IncomingMessage, ServerResponse>;

/**
 * Shortcut type for a HTTP 1 'not found' handler.
 */
export type Http1NotFoundHandler = HttpNotFoundHandler<IncomingMessage, ServerResponse>;

/**
 * Shortcut type for a HTTP 1 extender context.
 */
export type Http1ServerExtenderContext = IHttpServerExtenderContext<IncomingMessage, ServerResponse>;

/**
 * Shortcut type for a HTTP 1 request handler.
 */
export type Http1RequestErrorHandler = RequestErrorHandler<IncomingMessage, ServerResponse>;

/**
 * Shortcut for a HTTP 1 request handler.
 */
export type Http1RequestHandler = HttpRequestHandler<IncomingMessage, ServerResponse>;

type Http1RequestHandlerContext = IHttpRequestHandlerContext<IncomingMessage, ServerResponse>;

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
 * A HTTP 1.x server instance.
 */
export interface IHttp1Server extends IHttpServer<IncomingMessage, ServerResponse> {
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
 * @returns {Promise<IHttp1Server>} The promise with the new instance.
 */
export async function createHttp1Server(options?: Nilable<CreateHttp1ServerOptions>): Promise<IHttp1Server> {
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
    const server = (async (request: IncomingMessage, response: ServerResponse) => {
        try {
            let ctx: Nilable<Http1RequestHandlerContext>;

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
                        console.error("[HTTP1 NOT FOUND HANDLER]", ex);

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
                    console.error("[HTTP1 ERROR HANDLER]", ex);

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

        (server as any)[httpMethod] = (pathOrValidator: HttpRequestPath<IncomingMessage>, ...args: any[]) => {
            let handler: HttpRequestHandler<IncomingMessage, ServerResponse>;
            let isPathValid: HttpPathValidator<IncomingMessage>;
            let middlewares: Http1Middleware[];

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
                // args[1]: HttpMiddleware<IncomingMessage, ServerResponse>[]
                // args[2]: HttpRequestHandler<IncomingMessage, ServerResponse>

                middlewares = args[0];
                handler = args[1];
            }
            else {
                // args[1]: HttpRequestHandler<IncomingMessage, ServerResponse>

                middlewares = [];
                handler = args[0];
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
