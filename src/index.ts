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

/// <reference path="../index.d.ts" />

import { createServer as createHttpServer, IncomingMessage, Server, ServerResponse } from 'http';
import type { HttpErrorHandler, HttpMiddleware, HttpNotFoundHandler, HttpOptionsOrMiddlewares, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpRequest, IHttpRequestHandlerOptions, IHttpResponse, IHttpServer, NextFunction } from './types';
import type { GroupedHttpRequestHandlers } from './types/internal';
import { isNil } from './utils';

/**
 * The default HTTP error handler.
 *
 * @param {any} error The thrown error.
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export const defaultHttpErrorHandler: HttpErrorHandler = async (error, request, response) => {
    logError(error);

    if (!response.headersSent) {
        response.writeHead(500, {
            'Content-Length': '0'
        });
    }

    response.end();
};

/**
 * The default 'not found' handler.
 *
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export const defaultHttpNotFoundHandler: HttpNotFoundHandler = async (request, response) => {
    if (!response.headersSent) {
        response.writeHead(404, {
            'Content-Length': '0'
        });
    }

    response.end();
};

const supportedHttpMethods = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'];

/**
 * Creates a new instance of a HTTP server.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { json, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * app.get('/', async (request: IHttpRequest, response: IHttpResponse) => {
 *     response.write('Hello!')
 *     // no response.end() needed here!
 * })
 *
 * await app.listen(8181)
 * console.log('HTTP server is running')
 * ```
 *
 * @returns {IHttpServer} The new instance.
 */
export const createServer = (): IHttpServer => {
    let errorHandler: HttpErrorHandler = defaultHttpErrorHandler;
    const globalMiddleWares: HttpMiddleware[] = [];
    let instance: Server | undefined;
    let notFoundHandler: HttpNotFoundHandler = defaultHttpNotFoundHandler;

    const getErrorHandler = () => errorHandler;

    const groupedHandlers: GroupedHttpRequestHandlers = {};
    let compiledHandlers: GroupedHttpRequestHandlers = groupedHandlers;
    const recompileHandlers = () => {
        compiledHandlers = compileAllWithMiddlewares(
            groupedHandlers,
            globalMiddleWares,
            getErrorHandler
        );
    };

    const server: IHttpServer = (async (request: IncomingMessage, response: ServerResponse) => {
        try {
            const context = compiledHandlers[request.method!]?.find(ctx => ctx.isPathValid(request));

            if (context?.handler) {
                await context.handler(request as IHttpRequest, response as IHttpResponse);

                context.end(response);
            } else {
                notFoundHandler(request, response)
                    .catch(logError);
            }
        } catch (error) {
            errorHandler(error, request, response)
                .catch(logError);
        }
    }) as any;

    const resetInstance = () => {
        (server as any).port = undefined;
        instance = undefined;
    };

    // request handler methods
    // .connect(), .get(), .post(), etc.
    supportedHttpMethods.forEach(method => {
        (server as any)[method.toLowerCase()] = (...args: any[]) => {
            const path: HttpRequestPath = args[0];
            if (
                !(
                    typeof path === 'string' ||
                    path instanceof RegExp ||
                    typeof path === 'function'
                )
            ) {
                throw new TypeError('path must be of type string, function or RegEx');
            }

            let optionsOrMiddlewares: HttpOptionsOrMiddlewares | null | undefined;
            let handler: HttpRequestHandler;
            if (args.length < 3) {
                // args[1]: HttpRequestHandler
                handler = args[1];
            } else {
                // args[1]: HttpOptionsOrMiddlewares
                // args[2]: HttpRequestHandler
                optionsOrMiddlewares = args[1];
                handler = args[2];
            }

            if (typeof handler !== 'function') {
                throw new TypeError('handler must be a function');
            }

            let options: IHttpRequestHandlerOptions;
            if (optionsOrMiddlewares) {
                if (Array.isArray(optionsOrMiddlewares)) {
                    // list of middlewares
                    options = {
                        use: optionsOrMiddlewares
                    };
                } else if (typeof optionsOrMiddlewares === 'function') {
                    // single middleware
                    options = {
                        use: [optionsOrMiddlewares]
                    };
                } else {
                    // options object
                    options = optionsOrMiddlewares;
                }
            } else {
                options = {};
            }

            if (typeof options !== 'object') {
                throw new TypeError('optionsOrMiddlewares must be an object or array');
            }

            const middlewares = options.use?.filter(mw => !!mw);
            if (middlewares?.length) {
                if (!middlewares.every(mw => typeof mw === 'function')) {
                    throw new TypeError('optionsOrMiddlewares.use must be an array of functions');
                }
            }

            if (!groupedHandlers[method]) {
                // group is not initialized yet
                groupedHandlers[method] = [];
            }

            // setup request handler
            if (middlewares?.length) {
                handler = mergeHandler(handler, middlewares, getErrorHandler);
            }

            // eslint-disable-next-line @typescript-eslint/naming-convention
            const autoEnd = isNil(options.autoEnd) ? true : options.autoEnd;
            if (typeof autoEnd !== 'boolean') {
                throw new TypeError('optionsOrMiddlewares.autoEnd must be boolean');
            }

            // path validator
            let isPathValid: HttpPathValidator;
            if (typeof path === 'function') {
                isPathValid = path;
            } else if (path instanceof RegExp) {
                isPathValid = isPathValidByRegex(path);
            } else {
                isPathValid = isPathValidByString(path);
            }

            groupedHandlers[method].push({
                end: autoEnd ? endRequest : doNotEndRequest,
                handler,
                isPathValid
            });
            recompileHandlers();

            return server;
        };
    });

    server.setErrorHandler = (handler) => {
        if (typeof handler !== 'function') {
            throw new TypeError('handler must be a function');
        }

        errorHandler = handler;

        return server;
    };

    server.setNotFoundHandler = (handler) => {
        if (typeof handler !== 'function') {
            throw new TypeError('handler must be a function');
        }

        notFoundHandler = handler;

        return server;
    };

    server.use = (...middlewares: HttpMiddleware[]) => {
        const moreMiddlewares = middlewares.filter(mw => !!mw);
        if (!moreMiddlewares.every(mw => typeof mw === 'function')) {
            throw new TypeError('middlewares must be a list of functions');
        }

        globalMiddleWares.push(...moreMiddlewares);
        recompileHandlers();

        return server;
    };

    server.listen = (port) => {
        if (typeof port === 'string') {
            port = port.trim();
            if (port !== '') {
                port = parseInt(port);
            } else {
                port = undefined;
            }
        }

        if (isNil(port)) {
            if (process.env.NODE_ENV?.toLowerCase().trim() === 'development') {
                port = 8080;
            } else {
                port = 80;
            }
        }

        if (typeof port !== 'number' || isNaN(port) || port < 0 || port > 65535) {
            throw new TypeError('port must be a valid number between 0 and 65535');
        }

        return new Promise<void>((resolve, reject) => {
            const newInstance = createHttpServer(server);

            newInstance.once('error', err => {
                resetInstance();

                reject(err);
            });

            newInstance.listen(port, () => {
                (server as any).port = port as number;

                resolve(undefined);
            });

            instance = newInstance;
        });
    };

    server.close = () => new Promise((resolve, reject) => {
        instance!.close(err => {
            if (err) {
                reject(err);
            } else {
                resetInstance();

                resolve(undefined);
            }
        });
    });

    (server as any).isEgoHttpServer = true;

    resetInstance();

    return server;
};

/**
 * @inheritdoc
 */
export default createServer;


function compileAllWithMiddlewares(
    groupedHandlers: GroupedHttpRequestHandlers,
    middlewares: HttpMiddleware[],
    getErrorHandler: () => HttpErrorHandler
): GroupedHttpRequestHandlers {
    if (!middlewares.length) {
        return groupedHandlers;
    }

    const compiledHandlers: GroupedHttpRequestHandlers = {};
    for (const method in groupedHandlers) {
        compiledHandlers[method] = groupedHandlers[method].map(ctx => ({
            end: ctx.end,
            handler: mergeHandler(ctx.handler, middlewares, getErrorHandler),
            isPathValid: ctx.isPathValid
        }));
    }

    return compiledHandlers;
}

function doNotEndRequest() { }

function endRequest(response: ServerResponse) {
    response.end();
}

function isPathValidByRegex(path: RegExp) {
    return (req: IncomingMessage) => path.test(req.url!);
}

function isPathValidByString(path: string) {
    return (req: IncomingMessage) => req.url === path;
}

function logError(error: any) {
    console.error('[ERROR]', 'HTTP Server:', error);
}

function mergeHandler(
    handler: HttpRequestHandler,
    middlewares: HttpMiddleware[],
    getErrorHandler: () => HttpErrorHandler
): HttpRequestHandler {
    return async function (request, response) {
        return new Promise<any>((resolve, reject) => {
            let i = -1;

            const handleError = (error: any) => getErrorHandler()(error, request, response);

            const next: NextFunction = () => {
                const mw = middlewares[++i];

                if (mw) {
                    mw(request, response, next)
                        .catch(handleError)
                        .catch(reject);
                } else {
                    handler(request, response)
                        .then(resolve)
                        .catch(handleError)
                        .catch(reject);
                }
            };

            next();
        });
    };
}


// EXPORTS
export {
    HttpErrorHandler,
    HttpMiddleware,
    HttpNotFoundHandler,
    HttpOptionsOrMiddlewares,
    HttpPathValidator,
    HttpRequestHandler,
    HttpRequestPath,
    NextFunction,
    IHttpServer,
    IHttpRequest,
    IHttpResponse,
    IHttpRequestHandlerOptions
} from './types';

export {
    buffer,
    json
} from './middlewares';
// EXPORTS
