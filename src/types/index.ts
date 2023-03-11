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
 * Validates a request path.
 *
 * @param {TRequest} request The request context.
 *
 * @returns {boolean|PromiseLike<boolean>} A value, which indicates, that path does match or not.
 */
export type HttpPathValidator<TRequest> = (request: TRequest) => boolean | PromiseLike<boolean>;

/**
 * A middleware.
 *
 * @param {TRequest} request The request context.
 * @param {TResponse} response The response context.
 * @param {NextFunction} next The next function.
 */
export type HttpMiddleware<TRequest, TResponse> =
    (request: TRequest, response: TResponse, next: NextFunction) => any;

/**
 * A 'not found' handler.
 *
 * @param {TRequest} request The request context.
 * @param {TResponse} response The response context.
 */
export type HttpNotFoundHandler<TRequest, TResponse> =
    (request: TRequest, response: TResponse) => any;

/**
 * A HTTP request handler.
 *
 * @param {TRequest} request The request context.
 * @param {TResponse} response The response context.
 */
export type HttpRequestHandler<TRequest, TResponse> =
    (request: TRequest, response: TResponse) => any;

/**
 * A possible value for a request path.
 */
export type HttpRequestPath<TRequest> = string | RegExp | HttpPathValidator<TRequest>;

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
     * Adds a handler for a CONNECT request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    connect(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    connect(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * Adds a handler for a DELETE request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    delete(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    delete(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * Extends the server.
     *
     * @param {HttpServerExtender<TRequest, TResponse>} extender The function, that extends the server.
     */
    extend(extender: HttpServerExtender<TRequest, TResponse>): void;

    /**
     * Adds a handler for a GET request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    get(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    get(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * Adds a handler for a HEAD request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    head(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    head(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * The instance, otherwise `undefined`.
     */
    readonly instance: Optional<any>;

    /**
     * Starts listening on a port.
     *
     * @param {Nilable<number|string>} [port] The custom TCP port to listen on.
     *
     * @remarks The no port is defined, `8080` will be default, if `NODE_ENV` is `development`, otherwise `80`.
     */
    listen(port?: Nilable<number | string>): Promise<number>;

    /**
     * Adds a handler for a OPTIONS request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    options(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    options(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * Adds a handler for a PATCH request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    patch(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    patch(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * The current TCP port, server is running on, otherwise `undefined`.
     */
    readonly port: Optional<number>;

    /**
     * Adds a handler for a POST request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    post(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    post(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * Sets a custom error handler.
     *
     * @param {RequestErrorHandler<TRequest, TResponse>} handler The new handler to set.
     */
    setErrorHandler(handler: RequestErrorHandler<TRequest, TResponse>): void;

    /**
     * Sets a custom 'not found' handler.
     *
     * @param {HttpNotFoundHandler<TRequest, TResponse>} handler The new handler to set.
     */
    setNotFoundHandler(handler: HttpNotFoundHandler<TRequest, TResponse>): void;

    /**
     * Adds a handler for a TRACE request.
     *
     * @param {HttpPathValidator<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     */
    trace(pathOrValidator: HttpPathValidator<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): void;
    trace(pathOrValidator: HttpPathValidator<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): void;

    /**
     * Adds one or more middlewares.
     *
     * @param {HttpMiddleware<TRequest, TResponse>[]} [middlewares] One or more middleware to add.
     */
    use: (...middlewares: HttpMiddleware<TRequest, TResponse>[]) => void;
}

/**
 * A next function.
 *
 * @param {Nilable<any>} [error] The error, if occurred.
 */
export type NextFunction = (error?: Nilable<any>) => void;
