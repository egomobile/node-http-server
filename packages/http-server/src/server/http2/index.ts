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
import { createSecureServer, createServer, Http2Server, Http2ServerRequest, Http2ServerResponse, SecureServerOptions, ServerOptions } from "node:http2";

import type { RequestErrorHandler } from "../../errors/index.js";
import type { HttpMethod, HttpMiddleware, HttpNotFoundHandler, HttpPathValidator, HttpRequestHandler, IHttpRequest, IHttpRequestHandlerOptions, IHttpResponse, IHttpServer, IHttpServerExtenderContext, IHttpServerIsListingEventContext, IHttpServerStartsListingEventContext } from "../../types/index.js";
import type { IHttpRequestHandlerContext, Nilable, Optional } from "../../types/internal.js";
import { isDev, isNil } from "../../utils/internal.js";
import { createRequestHandler, setupServerInstance } from "../factories.js";

/**
 * Options for `createHttp2Server()` function.
 */
export type CreateHttp2ServerOptions =
    ICreateSecureHttp2ServerOptions |
    ICreateUnsecureHttp2ServerOptions;

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
 * Basic options for `createHttp2Server()` function.
 */
export interface ICreateHttp2ServerOptions {
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
 * Options for `createHttp2Server()` function, creating a secure instance.
 */
export interface ICreateSecureHttp2ServerOptions extends ICreateHttp2ServerOptions {
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
export interface ICreateUnsecureHttp2ServerOptions extends ICreateHttp2ServerOptions {
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
 * @param {Nilable<CreateHttp2ServerOptions>} [options] The custom options.
 *
 * @returns {IHttp2Server} The new instance.
 */
export function createHttp2Server(options?: Nilable<CreateHttp2ServerOptions>): IHttp2Server {
    if (!isNil(options)) {
        if (typeof options !== "object") {
            throw new TypeError("options must be of type object");
        }
    }

    const compiledHandlers: Partial<Record<Uppercase<HttpMethod>, Http2RequestHandlerContext[]>> = {};
    let errorHandler = defaultHttp2RequestErrorHandler;
    const events = new EventEmitter();
    const globalMiddlewares: Http2Middleware[] = [];
    let instance: Optional<Http2Server>;
    let notFoundHandler = defaultHttp2NotFoundHandler;
    let port: Optional<number>;
    const shouldNotParsePathParams = isNil(options?.noAutoParams) ? null : !!options?.noAutoParams;
    const shouldNotParseQueryParams = isNil(options?.noAutoQuery) ? null : !!options?.noAutoQuery;

    // define server instance as request handler for
    // a `Http2Server` instance first
    const server = createRequestHandler({
        compiledHandlers,
        "getErrorHandler": () => {
            return errorHandler;
        },
        "getNotFoundHandler": () => {
            return notFoundHandler;
        }
    }) as unknown as IHttp2Server;

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

            events.emit(
                "server:listen",
                {
                    "port": tcpPort
                } as IHttpServerStartsListingEventContext
            );

            newInstance.listen(tcpPort, () => {
                instance = newInstance;
                port = tcpPort;

                events.emit(
                    "server:listening",
                    {
                        "port": tcpPort
                    } as IHttpServerIsListingEventContext
                );

                return resolve(tcpPort);
            });
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
        "httpVersion": 2,
        "onErrorHandlerUpdate": (handler) => {
            errorHandler = handler as Http2RequestErrorHandler;
        },
        "onNotFoundHandlerUpdate": (handler) => {
            notFoundHandler = handler as Http2NotFoundHandler;
        },
        server,
        shouldNotParsePathParams,
        shouldNotParseQueryParams
    }) as IHttp2Server;
}
