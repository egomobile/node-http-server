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

import { EventEmitter } from "node:events";
import { createServer, IncomingMessage, Server, ServerOptions, ServerResponse } from "node:http";
import { createServer as createSecureServer, ServerOptions as SecureServerOptions } from "node:https";

import type { RequestErrorHandler } from "../../errors/index.js";
import type { HttpMethod, HttpMiddleware, HttpNotFoundHandler, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpRequest, IHttpRequestHandlerOptions, IHttpResponse, IHttpServer, IHttpServerExtenderContext, IHttpServerHasBeenClosedEventContext, IHttpServerIsClosingEventContext, IHttpServerIsListingEventContext, IHttpServerStartsListingEventContext } from "../../types/index.js";
import type { IHttpRequestHandlerContext, Nilable, Optional } from "../../types/internal.js";
import { isDev, isNil } from "../../utils/internal.js";
import { createRequestHandler, setupServerInstance } from "../factories.js";

/**
 * Options for `createHttp1Server()` function.
 */
export type CreateHttp1ServerOptions =
    ICreateSecureHttp1ServerOptions |
    ICreateUnsecureHttp1ServerOptions;

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
 * Basic options for `createHttp1Server()` function.
 */
export interface ICreateHttp1ServerOptions {
    /**
     * Indicates, if default behavior of automatically setup parameters, should be
     * deactivated or not.
     */
    noAutoParams?: Nilable<boolean>;

    /**
     * If `true`, do not parse query parameters automatically.
     */
    noAutoQuery?: Nilable<boolean>;
}

/**
 * Options for `createHttp1Server()` function, creating a secure instance.
 */
export interface ICreateSecureHttp1ServerOptions extends ICreateHttp1ServerOptions {
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
export interface ICreateUnsecureHttp1ServerOptions extends ICreateHttp1ServerOptions {
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
    const events = new EventEmitter();
    const globalMiddlewares: Http1Middleware[] = [];
    let instance: Optional<Server>;
    let isRunningInDryMode: Optional<boolean>;
    let notFoundHandler = defaultHttp1NotFoundHandler;
    let port: Optional<number>;
    const shouldNotParsePathParams = isNil(options?.noAutoParams) ? null : !!options?.noAutoParams;
    const shouldNotParseQueryParams = isNil(options?.noAutoQuery) ? null : !!options?.noAutoQuery;

    // define server instance as request handler for
    // a `Server` instance first
    const server = createRequestHandler({
        compiledHandlers,
        "getErrorHandler": () => {
            return errorHandler;
        },
        "getNotFoundHandler": () => {
            return notFoundHandler;
        }
    }) as unknown as IHttp1Server;

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

            const listenContext: IHttpServerStartsListingEventContext = {
                "dryRun": false,
                "port": tcpPort
            };

            events.emit("server:listen", listenContext);

            const shouldRunInDryMode = !!listenContext.dryRun;
            const done = () => {
                isRunningInDryMode = shouldRunInDryMode;
                instance = newInstance;
                port = tcpPort;

                const listeningContext: IHttpServerIsListingEventContext = {
                    "dryRun": shouldRunInDryMode,
                    "port": tcpPort
                };

                events.emit("server:listening", listeningContext);

                return resolve(tcpPort);
            };

            if (shouldRunInDryMode) {
                done();
            }
            else {
                newInstance.listen(tcpPort, done);
            }
        });
    };

    // server.close()
    server.close = async () => {
        return new Promise<boolean>((resolve, reject) => {
            const emitClosed = (error?: any) => {
                const closedContext: IHttpServerHasBeenClosedEventContext = {
                    "dryRun": isRunningInDryMode,
                    error,
                    port
                };

                instance = undefined;
                isRunningInDryMode = undefined;
                port = undefined;

                events.emit("server:closed", closedContext);
            };

            const closeContext: IHttpServerIsClosingEventContext = {
                "dryRun": isRunningInDryMode,
                port
            };

            events.emit("server:close", closeContext);

            if (instance) {
                instance.close((error?: any) => {
                    emitClosed(error);

                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                emitClosed();

                resolve(false);
            }
        });
    };

    return setupServerInstance({
        compiledHandlers,
        events,
        "getInstance": () => {
            return instance;
        },
        "getPort": () => {
            return port;
        },
        globalMiddlewares,
        "httpVersion": 1,
        "onErrorHandlerUpdate": (handler) => {
            errorHandler = handler as Http1RequestErrorHandler;
        },
        "onNotFoundHandlerUpdate": (handler) => {
            notFoundHandler = handler as Http1NotFoundHandler;
        },
        server,
        shouldNotParsePathParams,
        shouldNotParseQueryParams
    }) as IHttp1Server;
}
