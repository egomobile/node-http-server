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
import joi from 'joi';
import { setupHttpServerControllerMethod } from './controllers/factories';
import type { HttpErrorHandler, HttpMiddleware, HttpNotFoundHandler, HttpOptionsOrMiddlewares, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpRequest, IHttpRequestHandlerOptions, IHttpResponse, IHttpServer, NextFunction } from './types';
import type { GroupedHttpRequestHandlers, Nilable, Optional } from './types/internal';
import { asAsync, getUrlWithoutQuery, isNil } from './utils';

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
    const globalMiddlewares: HttpMiddleware[] = [];
    let instance: Optional<Server>;
    let notFoundHandler: HttpNotFoundHandler = defaultHttpNotFoundHandler;

    const getErrorHandler = () => errorHandler;

    const groupedHandlers: GroupedHttpRequestHandlers = {};
    let compiledHandlers: GroupedHttpRequestHandlers = groupedHandlers;
    const recompileHandlers = () => {
        compiledHandlers = compileAllWithMiddlewares(
            groupedHandlers,
            globalMiddlewares,
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
                throw new TypeError('path must be of type string, function or RegExp');
            }

            let optionsOrMiddlewares: Nilable<HttpOptionsOrMiddlewares>;
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

            // keep sure to have an async function here
            handler = asAsync<HttpRequestHandler>(handler);

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
                isPathValid,
                middlewares: middlewares?.map(mw => asAsync<HttpMiddleware>(mw))
            });
            recompileHandlers();

            return server;
        };
    });

    // server.all()
    (server as any).all = (...args: any[]) => {
        supportedHttpMethods.forEach(method => {
            (server as any)[method.toLowerCase()](...args);
        });
    };

    server.setErrorHandler = (handler) => {
        if (typeof handler !== 'function') {
            throw new TypeError('handler must be a function');
        }

        // keep sure to have an async function here
        errorHandler = asAsync(handler);

        return server;
    };

    server.setNotFoundHandler = (handler) => {
        if (typeof handler !== 'function') {
            throw new TypeError('handler must be a function');
        }

        // keep sure to have an async function here
        notFoundHandler = asAsync(handler);

        return server;
    };

    server.use = (...middlewares: HttpMiddleware[]) => {
        const moreMiddlewares = middlewares.filter(mw => !!mw);
        if (!moreMiddlewares.every(mw => typeof mw === 'function')) {
            throw new TypeError('middlewares must be a list of functions');
        }

        // keep sure to have an async functions here
        globalMiddlewares.push(...moreMiddlewares.map(mw => asAsync<HttpMiddleware>(mw)));

        recompileHandlers();

        return server;
    };

    server.listen = (port?) => {
        if (typeof port === 'string') {
            port = port.trim();

            if (port?.length) {
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

            newInstance.listen(port as number, '0.0.0.0', () => {
                (server as any).port = port;

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

    // server.errorHandler
    Object.defineProperty(server, 'errorHandler', {
        enumerable: true,
        get: () => errorHandler
    });

    // server.notFoundHandler
    Object.defineProperty(server, 'notFoundHandler', {
        enumerable: true,
        get: () => notFoundHandler
    });

    setupHttpServerControllerMethod(server);

    resetInstance();

    return server;
};

/**
 * @inheritdoc
 */
export default createServer;


function compileAllWithMiddlewares(
    groupedHandlers: GroupedHttpRequestHandlers,
    globalMiddlewares: HttpMiddleware[],
    getErrorHandler: () => HttpErrorHandler
): GroupedHttpRequestHandlers {
    const compiledHandlers: GroupedHttpRequestHandlers = {};

    for (const method in groupedHandlers) {
        compiledHandlers[method] = groupedHandlers[method].map(ctx => ({
            end: ctx.end,
            handler: mergeHandler(
                ctx.handler,
                [
                    ...globalMiddlewares,  // global middles
                    ...(ctx.middlewares?.length ? ctx.middlewares : [])  // route specific middlewares
                ],
                getErrorHandler
            ),
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
    return (req: IncomingMessage) => path.test(getUrlWithoutQuery(req.url)!);
}

function isPathValidByString(path: string) {
    return (req: IncomingMessage) => getUrlWithoutQuery(req.url) === path;
}

function logError(error: any) {
    console.error('[ERROR]', 'HTTP Server:', error);
}

function mergeHandler(
    handler: HttpRequestHandler,
    middlewares: HttpMiddleware[],
    getErrorHandler: () => HttpErrorHandler
): HttpRequestHandler {
    if (!middlewares.length) {
        return handler;  // nothing to merge
    }

    return function (request, response) {
        return new Promise<any>((resolve, reject) => {
            const handleError = (error: any) => getErrorHandler()(
                error, request, response
            );

            let i = -1;

            const next: NextFunction = (error?) => {
                try {
                    if (!error) {
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
                    } else {
                        handleError(error)
                            .catch(reject);
                    }
                } catch (ex) {
                    handleError(ex)
                        .catch(reject);
                }
            };

            next();
        });
    };
}


// <EXPORTS>
export {
    AlternativesSchema,
    AnySchema,
    ArraySchema,
    BinarySchema,
    BooleanSchema,
    DateSchema, ExtensionBoundSchema, FunctionSchema,
    isSchema, LinkSchema,
    NumberSchema,
    ObjectPropertiesSchema,
    ObjectSchema, PartialSchemaMap, Schema, SchemaFunction, SchemaInternals, SchemaLike,
    SchemaLikeWithoutArray,
    SchemaMap, StrictSchemaMap, StringSchema, SymbolSchema, ValidationError as JoiValidationError
} from 'joi';
export {
    OpenAPIV3
} from 'openapi-types';
export * from './controllers';
export * from './errors';
export * from './middlewares';
export * from './types';
export * from './validators';

export const schema = joi;


// </EXPORTS>
