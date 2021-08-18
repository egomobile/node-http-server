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

import type { IncomingMessage, ServerResponse } from 'http';

/**
 * A HTTP error handler.
 *
 * @param {any} error The error.
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export type HttpErrorHandler = (error: any, request: IncomingMessage, response: ServerResponse) => Promise<any>;

/**
 * A middleware.
 *
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 * @param {NextFunction} next The next function.
 */
export type HttpMiddleware = (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => Promise<any>;

/**
 * A 'not found' handler.
 *
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export type HttpNotFoundHandler = (request: IncomingMessage, response: ServerResponse) => Promise<any>;

/**
 * Request handler options or one or more middleware(s).
 */
export type HttpOptionsOrMiddlewares = IHttpRequestHandlerOptions | HttpMiddleware | HttpMiddleware[];

/**
 * Validates a request path.
 *
 * @param {IncomingMessage} request The request context.
 *
 * @returns {boolean} Path does match or not.
 */
export type HttpPathValidator = (request: IncomingMessage) => boolean;

/**
 * A request handler.
 *
 * @param {IHttpResponse} request The request context.
 * @param {Response} response The response context.
 */
export type HttpRequestHandler = (request: IHttpRequest, response: IHttpResponse) => Promise<any>;

/**
 * A possible value for a request path.
 */
export type HttpRequestPath = string | RegExp | HttpPathValidator;

/**
 * Options for a request handler.
 */
export interface IHttpRequestHandlerOptions {
    /**
     * A list of one or more middlewares.
     */
    use?: HttpMiddleware[] | null | undefined;
}

/**
 * A HTTP request.
 */
export interface IHttpRequest extends IncomingMessage {
}

/**
 * A HTTP response.
 */
export interface IHttpResponse extends ServerResponse {
}

/**
 * A HTTP server instance.
 */
export interface IHttpServer {
    /**
     * A HTTP server itself is a HTTP request listener,
     * which can be used in any compatible server instance, like
     * Node HTTP, e.g.
     */
    (request: IncomingMessage, response: ServerResponse): void;

    /**
     * Closes / stops the server.
     */
    close(): Promise<void>;

    /**
     * Registers a route for a CONNECT request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    connect(path: HttpRequestPath, handler: HttpRequestHandler): this;
    connect(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a DELETE request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    delete(path: HttpRequestPath, handler: HttpRequestHandler): this;
    delete(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a GET request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    get(path: HttpRequestPath, handler: HttpRequestHandler): this;
    get(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a HEAD request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    head(path: HttpRequestPath, handler: HttpRequestHandler): this;
    head(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Indicates if that instance is an e.GO HTTP server.
     */
    readonly isEgoHttpServer: true;

    /**
     * Starts listening for connections.
     *
     * @param {number|string} [port] The custom TCP port.
     *                               Default is 8080 in development mode (NODE_ENV), otherwise 80.
     */
    listen(port?: number | string | null): Promise<void>;

    /**
     * Registers a route for a OPTIONS request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    options(path: HttpRequestPath, handler: HttpRequestHandler): this;
    options(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a PATCH request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    patch(path: HttpRequestPath, handler: HttpRequestHandler): this;
    patch(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * The current TCP port or (undefined) if server is not running.
     */
    readonly port?: number;

    /**
     * Registers a route for a POST request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    post(path: HttpRequestPath, handler: HttpRequestHandler): this;
    post(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a PUT request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    put(path: HttpRequestPath, handler: HttpRequestHandler): this;
    put(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Sets a new error handler.
     *
     * @param {HttpErrorHandler} handler The new handler.
     *
     * @returns {this}
     */
    setErrorHandler(handler: HttpErrorHandler): this;

    /**
     * Sets a new 'not found' handler.
     *
     * @param {HttpNotFoundHandler} handler The new handler.
     *
     * @returns {this}
     */
    setNotFoundHandler(handler: HttpNotFoundHandler): this;

    /**
     * Registers a route for a TRACE request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     */
    trace(path: HttpRequestPath, handler: HttpRequestHandler): this;
    trace(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Adds one or more global middlewares.
     *
     * @param {Middleware[]} [middlewares] The middlewares to add.
     *
     * @returns {this}
     */
    use(...middlewares: HttpMiddleware[]): this;
}

/**
 * A next function.
 */
export type NextFunction = () => void;
