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
import type { ValidationError as JoiValidationError } from 'joi';
import type { ParseError } from '../errors/parse';

/**
 * A HTTP error handler.
 *
 * @param {any} error The error.
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export type HttpErrorHandler = (error: any, request: IncomingMessage, response: ServerResponse) => any;

/**
 * A middleware.
 *
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 * @param {NextFunction} next The next function.
 */
export type HttpMiddleware = (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => any;

/**
 * A 'not found' handler.
 *
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export type HttpNotFoundHandler = (request: IncomingMessage, response: ServerResponse) => any;

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
export type HttpRequestHandler = (request: IHttpRequest, response: IHttpResponse) => any;

/**
 * A possible value for a request path.
 */
export type HttpRequestPath = string | RegExp | HttpPathValidator;

/**
 * Options for 'body()' function.
 */
export interface IHttpBodyParserOptions {
    /**
     * Defines the maximum size of the body, in bytes.
     * (null) indicates to use NO limit
     */
    limit?: Nilable<number>;
    /**
     * A custom handler, to tell the client, that the body is too big.
     */
    onLimitReached?: Nilable<HttpRequestHandler>;
}

/**
 * Options for a request handler.
 */
export interface IHttpRequestHandlerOptions {
    /**
     * Automatic call `end()` method on response context
     * when handler was executed successfully.
     *
     * Default: (true)
     */
    autoEnd?: Optional<boolean>;
    /**
     * A list of one or more middlewares.
     */
    use?: Nilable<HttpMiddleware[]>;
}

/**
 * A HTTP request.
 */
export interface IHttpRequest<TBody extends any = any> extends IncomingMessage {
    /**
     * The body, if parsed.
     */
    body?: TBody;
    /**
     * List of cookies, if parsed.
     */
    cookies?: Record<string, string>;
    /**
     * The current language, if parsed.
     */
    lang?: Nullable<string>;
    /**
     * List of query parameters, if parsed.
     */
    query?: URLSearchParams;
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
     *
     * @example
     * ```
     * import createServer from '@egomobile/http-server'
     * import { createServer as createHTTPServer } from 'http'
     *
     * const app = createServer()
     * const server = createHTTPServer(app)
     *
     * server.listen(8080, () => {
     *   console.log('Server is listing')
     * })
     * ```
     */
    (request: IncomingMessage, response: ServerResponse): void;

    /**
     * Closes / stops the server.
     *
     * @example
     * ```
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * await app = server.listen()
     * console.log('Server is listening')
     *
     * setTimeout(() => {
     *     app.close().catch(console.error)
     * }, 60000)
     * ```
     */
    close(): Promise<void>;

    /**
     * Registers a route for a CONNECT request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.connect('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    connect(path: HttpRequestPath, handler: HttpRequestHandler): this;
    connect(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a DELETE request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.delete('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    delete(path: HttpRequestPath, handler: HttpRequestHandler): this;
    delete(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a GET request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.get('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    get(path: HttpRequestPath, handler: HttpRequestHandler): this;
    get(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a HEAD request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.head('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    head(path: HttpRequestPath, handler: HttpRequestHandler): this;
    head(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Indicates if that instance is an e.GO HTTP server.
     *
     * @example
     * ```
     * import assert from 'assert'
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * assert.strictEqual(app.isEgoHttpServer, true)
     * ```
     */
    readonly isEgoHttpServer: true;

    /**
     * Starts listening for connections.
     *
     * @param {Nilable<number|string>} [port] The custom TCP port.
     *                                        Default is 8080 in development mode (NODE_ENV), otherwise 80.
     *
     * @example
     * ```
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * await app.listen()  // if NODE_ENV === 'development', port is 8080
     *                     // otherwise port is 80
     *
     * await app.listen(5979)  // explicit port 5979
     * ```
     */
    listen(port?: Nilable<number | string>): Promise<void>;

    /**
     * Registers a route for a OPTIONS request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.options('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    options(path: HttpRequestPath, handler: HttpRequestHandler): this;
    options(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a PATCH request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.patch('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
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
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.post('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    post(path: HttpRequestPath, handler: HttpRequestHandler): this;
    post(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a PUT request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.put('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    put(path: HttpRequestPath, handler: HttpRequestHandler): this;
    put(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Sets a custom error handler.
     *
     * @param {HttpErrorHandler} handler The new handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.setErrorHandler(async (error: any, request: IHttpRequest, response: IHttpResponse) => {
     *     const errorMessage = Buffer.from('SERVER ERROR: ' + String(error))
     *
     *     if (!response.headersSent) {
     *         response.writeHead(500, {
     *             'Content-Length': String(errorMessage.length)
     *         })
     *     }
     *
     *     response.write(errorMessage)
     *     response.end()
     * })
     *
     * app.get('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     throw new Error('Something went wrong')
     * })
     *
     * await app.listen()
     * ```
     *
     * @returns {this}
     */
    setErrorHandler(handler: HttpErrorHandler): this;

    /**
     * Sets a new 'not found' handler.
     *
     * @param {HttpNotFoundHandler} handler The new handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.setNotFoundHandler(async (request: IHttpRequest, response: IHttpResponse) => {
     *     const errorMessage = Buffer.from(`The page ${request.url} could not be found`)
     *
     *     if (!response.headersSent) {
     *         response.writeHead(404, {
     *             'Content-Length': String(errorMessage.length)
     *         })
     *     }
     *
     *     response.write(errorMessage)
     *     response.end()
     * })
     *
     * // ... your routes
     *
     * await app.listen()
     * ```
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
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.trace('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    trace(path: HttpRequestPath, handler: HttpRequestHandler): this;
    trace(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Adds one or more global middlewares.
     *
     * @param {Middleware[]} [middlewares] The middlewares to add.
     *
     * @returns {this}
     *
     * @example
     * ```
     * import assert from 'assert'
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * assert.strictEqual(app.isEgoHttpServer, true)
     *
     * app.use(async (request: any, response: any, next) => {
     *     request.foo = '1'
     *     next()
     * }, async (request: any, response: any, next) => {
     *     // foo is currently '1'
     *     request.foo += 2
     *     next()
     * })
     *
     * app.get('/', async (request: any, response: any) => {
     *     response.write(String(request.foo === '12'))
     * })
     * ```
     */
    use(...middlewares: HttpMiddleware[]): this;
}

/**
 * A next function.
 *
 * @param {any} [error] The error, if occurred.
 */
export type NextFunction = (error?: any) => void;

/**
 * A type, that can also be (null) or (undefined).
 */
export type Nilable<T extends any = any> = Nullable<T> | Optional<T>;

/**
 * A type, that can also be (null).
 */
export type Nullable<T extends any = any> = T | null;

/**
 * A type, that can also be (undefined).
 */
export type Optional<T extends any = any> = T | undefined;

/**
 * A handler, that is executed, if data could not be parsed.
 *
 * @param {ParseError} error The thrown error.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export type ParseErrorHandler = (error: ParseError, request: IHttpRequest, response: IHttpResponse) => Promise<any>;

/**
 * A handler, that is executed, if data is invalid.
 *
 * @param {JoiValidationError} error The error information.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export type ValidationFailedHandler = (error: JoiValidationError, request: IHttpRequest, response: IHttpResponse) => any;
