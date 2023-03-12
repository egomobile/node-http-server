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
 * A generic HTTP request context.
 */
export interface IHttpRequest {
    /**
     * If available, the key/value pair of parameters.
     */
    params?: Record<string, string>;
}

/**
 * A generic HTTP response context.
 */
export interface IHttpResponse {
}

/**
 * Options for a HTTP request handler.
 */
export interface IHttpRequestHandlerOptions<TRequest, TResponse> {
    /**
     * Indicates, if default behavior of closing request connection automatically, should be
     * deactivated or not.
     */
    noAutoEnd?: Nilable<boolean>;

    /**
     * Indicates, if default behavior of automatically setup parameters, should be
     * deactivated or not.
     */
    noAutoParams?: Nilable<boolean>;

    /**
     * Additional middlewares to use.
     */
    use?: HttpMiddleware<TRequest, TResponse>[];
}

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
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    connect(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    connect(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    connect(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * Adds a handler for a DELETE request.
     *
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    delete(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    delete(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    delete(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * Extends the server.
     *
     * @param {HttpServerExtender<TRequest, TResponse>} extender The function, that extends the server.
     *
     * @returns {this}
     */
    extend(extender: HttpServerExtender<TRequest, TResponse>): this;

    /**
     * Adds a handler for a GET request.
     *
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    get(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    get(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    get(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * Adds a handler for a HEAD request.
     *
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    head(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    head(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    head(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * The HTTP major version.
     */
    readonly httpVersion: number;

    /**
     * The instance, otherwise `undefined`.
     */
    readonly instance: Optional<any>;

    /**
     * Starts listening on a port.
     *
     * @param {Nilable<number|string>} [port] The custom TCP port to listen on.
     *
     * @remarks If no port is defined, `8080` will be used as default, if `NODE_ENV` is `development`; otherwise `80`.
     */
    listen(port?: Nilable<number | string>): Promise<number>;

    /**
     * Adds a handler for a OPTIONS request.
     *
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    options(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    options(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    options(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * Adds a handler for a PATCH request.
     *
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    patch(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    patch(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    patch(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * The current TCP port, server is running on, otherwise `undefined`.
     */
    readonly port: Optional<number>;

    /**
     * Adds a handler for a POST request.
     *
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    post(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    post(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    post(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * Sets a custom error handler.
     *
     * @param {RequestErrorHandler<TRequest, TResponse>} handler The new handler to set.
     *
     * @returns {this}
     */
    setErrorHandler(handler: RequestErrorHandler<TRequest, TResponse>): this;

    /**
     * Sets a custom 'not found' handler.
     *
     * @param {HttpNotFoundHandler<TRequest, TResponse>} handler The new handler to set.
     *
     * @returns {this}
     */
    setNotFoundHandler(handler: HttpNotFoundHandler<TRequest, TResponse>): this;

    /**
     * Adds a handler for a TRACE request.
     *
     * @param {HttpRequestPath<TRequest>} pathOrValidator The path or the validator.
     * @param {HttpMiddleware<TRequest, TResponse>[]} middlewares One or more middleware to add.
     * @param {HttpRequestHandler<TRequest, TResponse>} handler The handler.
     * @param {IHttpRequestHandlerOptions<TRequest, TResponse>} [options] Custom options.
     *
     * @returns {this}
     */
    trace(pathOrValidator: HttpRequestPath<TRequest>, handler: HttpRequestHandler<TRequest, TResponse>): this;
    trace(pathOrValidator: HttpRequestPath<TRequest>, middlewares: HttpMiddleware<TRequest, TResponse>[], handler: HttpRequestHandler<TRequest, TResponse>): this;
    trace(pathOrValidator: HttpRequestPath<TRequest>, options: IHttpRequestHandlerOptions<TRequest, TResponse>, handler: HttpRequestHandler<TRequest, TResponse>): this;

    /**
     * Adds one or more middlewares.
     *
     * @param {HttpMiddleware<TRequest, TResponse>[]} [middlewares] One or more middleware to add.
     *
     * @returns {this}
     */
    use: (...middlewares: HttpMiddleware<TRequest, TResponse>[]) => this;
}

/**
 * A next function.
 *
 * @param {Nilable<any>} [error] The error, if occurred.
 */
export type NextFunction = (error?: Nilable<any>) => void;
