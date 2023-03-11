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

import type { RequestErrorHandler } from "../errors/index.js";
import type { Nilable, Optional } from "./internal.js";

/**
 * A possible value for a HTTP method.
 */
export type HttpMethod = "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

/**
 * A function, which extends an `IHttpServer` instance.
 *
 * @param {IHttpServerExtenderContext<TRequest, TResponse>} context The context.
 */
export type HttpServerExtender<TRequest, TResponse> =
    (context: IHttpServerExtenderContext<TRequest, TResponse>) => any;

/**
 * A possible version for a HTTP major protocol version.
 */
export type HttpServerVersion = 1 | 2;

/**
 * A context for a `HttpServerExtender` function.
 */
export interface IHttpServerExtenderContext<TRequest, TResponse> {
    /**
     * The underlying server.
     */
    server: IHttpServer<TRequest, TResponse>;
}

/**
 * A generic definition of a HTTP server.
 */
export interface IHttpServer<TRequest, TResponse> {
    /**
     * The server instance itself is already a request handler.
     */
    (request: TRequest, response: TResponse): any;

    /**
     * Extends the server.
     *
     * @param {HttpServerExtender<TRequest, TResponse>} extender The function, that extends the server.
     */
    extend(extender: HttpServerExtender<TRequest, TResponse>): Promise<void>;

    /**
     * The instance, otherwise `undefined`.
     */
    readonly instance: any;

    /**
     * Starts listening on a port.
     *
     * @param {Nilable<number|string>} [port] The custom TCP port to listen on.
     *
     * @remarks The no port is defined, `8080` will be default, if `NODE_ENV` is `development`, otherwise `80`.
     */
    listen(port?: Nilable<number | string>): Promise<number>;

    /**
     * The current TCP port, server is running on, otherwise `undefined`.
     */
    readonly port: Optional<number>;

    /**
     * Sets a custom error handler.
     *
     * @param {RequestErrorHandler<TRequest, TResponse>} handler The new handler to set.
     */
    setErrorHandler(handler: RequestErrorHandler<TRequest, TResponse>): Promise<void>;
}
