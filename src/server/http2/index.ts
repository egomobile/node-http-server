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

import { Http2Server, Http2ServerRequest, Http2ServerResponse, SecureServerOptions, ServerOptions, createSecureServer, createServer } from "node:http2";

import type { RequestErrorHandler } from "../../errors/index.js";
import type { IHttpServer, IHttpServerExtenderContext } from "../../types/index.js";
import type { Nilable, Optional } from "../../types/internal.js";
import { asAsync, isDev, isNil } from "../../utils/internal.js";

/**
 * Options for `createHttp2Server()` function.
 */
export type CreateHttp2ServerOptions =
    ICreateSecrureHttp2ServerOptions |
    ICreateUnsecrureHttp2ServerOptions;

/**
 * Shortcut type for a HTTP 2 extender context.
 */
export type Http2ServerExtenderContext = IHttpServerExtenderContext<Http2ServerRequest, Http2ServerResponse>;

/**
 * Shortcut type for a HTTP 2 request handler.
 */
export type Http2RequestErrorHandler = RequestErrorHandler<Http2ServerRequest, Http2ServerResponse>;

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

    let errorHandler = defaultHttp2RequestErrorHandler;
    let instance: Optional<Http2Server>;
    let port: Optional<number>;

    // define server instance as request handler for
    // a `Http2Server` instance first
    const server = (async (request: Http2ServerRequest, response: Http2ServerResponse) => {
        try {
            // TODO
            response.end();
        }
        catch (error) {
            errorHandler(error, request, response)
                .catch(console.error);
        }
    }) as unknown as IHttp2Server;

    // server.extend()
    server.extend = async (extender) => {
        if (typeof extender !== "function") {
            throw new TypeError("extender must be of type function");
        }

        const context: Http2ServerExtenderContext = {
            server
        };

        await Promise.resolve(
            extender(context)
        );
    };

    // server.setErrorHandler()
    server.setErrorHandler = async (newErrorHandler) => {
        if (typeof newErrorHandler !== "function") {
            throw new TypeError("handler must be of type function");
        }

        errorHandler = asAsync(newErrorHandler);
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
