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

import { createServer as createHttpServer, IncomingMessage, Server, ServerResponse } from "http";
import joi from "joi";
import { setupHttpServerControllerMethod } from "./controllers/factories";
import { setupHttpServerTestMethod } from "./controllers/tests";
import { setupEventMethods } from "./events";
import type { AfterAllTestsFunc, AfterEachTestFunc, BeforeAllTestsFunc, BeforeEachTestFunc, HttpErrorHandler, HttpMiddleware, HttpNotFoundHandler, HttpOptionsOrMiddlewares, HttpPathValidator, HttpRequestHandler, HttpRequestPath, IHttpRequest, IHttpRequestHandlerOptions, IHttpResponse, IHttpServer, NextFunction, UniqueHttpMiddleware } from "./types";
import type { GroupedHttpRequestHandlers, IRequestHandlerContext, Nilable, Optional } from "./types/internal";
import { asAsync, getUrlWithoutQuery, isNil, isTruthy } from "./utils";

/**
 * Options for `createServer()` function.
 */
export interface ICreateServerOptions {
    /**
     * Custom settings for (unit-)tests.
     */
    tests?: Nilable<{
        /**
         * A custom function, which should be executed AFTER ALL tests. This is executed once.
         */
        afterAll?: Nilable<AfterAllTestsFunc>;
        /**
         * A custom function, which should be executed AFTER EACH tests.
         */
        afterEach?: Nilable<AfterEachTestFunc>;
        /**
         * Allow empty test settings or not.
         *
         * @default false
         */
        allowEmptyTestSettings?: boolean;
        /**
         * A custom function, which should be executed BEFORE ALL tests. This is executed once.
         */
        beforeAll?: Nilable<BeforeAllTestsFunc>;
        /**
         * A custom function, which should be executed BEFORE EACH tests.
         */
        beforeEach?: Nilable<BeforeEachTestFunc>;
        /**
         * If no settings are specified, a module file with it is required.
         *
         * @default true
         */
        requiresModuleAsDefault?: Nilable<boolean>;
        /**
         * This is value indicates, that all endpoints require at least one test.
         *
         * @default true
         */
        requiresTestsEverywhere?: Nilable<boolean>;
        /**
         * Custom value for a (default) timeout for tests, in ms.
         *
         * @default 5000
         */
        timeout?: Nilable<number>;
    }>;
}

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
            "Content-Length": "0"
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
            "Content-Length": "0"
        });
    }

    response.end();
};

/**
 * Default timeout value for tests.
 */
export const defaultTestTimeout = 5000;

const supportedHttpMethods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];

/**
 * Creates a new instance of a HTTP server.
 *
 * @param {Nilable<ICreateServerOptions>} [serverOptions] Custom options.
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
export function createServer(serverOptions?: Nilable<ICreateServerOptions>): IHttpServer {
    if (!isNil(serverOptions?.tests?.afterAll) && typeof serverOptions?.tests?.afterAll !== "function") {
        throw new TypeError("serverOptions.tests.afterAll must be of type function");
    }
    if (!isNil(serverOptions?.tests?.afterEach) && typeof serverOptions?.tests?.afterEach !== "function") {
        throw new TypeError("serverOptions.tests.afterEach must be of type function");
    }
    if (!isNil(serverOptions?.tests?.beforeAll) && typeof serverOptions?.tests?.beforeAll !== "function") {
        throw new TypeError("serverOptions.tests.beforeAll must be of type function");
    }
    if (!isNil(serverOptions?.tests?.beforeEach) && typeof serverOptions?.tests?.beforeEach !== "function") {
        throw new TypeError("serverOptions.tests.beforeEach must be of type function");
    }

    let testTimeout = defaultTestTimeout;
    if (!isNil(serverOptions?.tests?.timeout)) {
        if (typeof serverOptions?.tests?.timeout !== "number") {
            throw new TypeError("serverOptions.tests.timeout must be of type number");
        }

        testTimeout = serverOptions.tests.timeout;
    }

    const shouldUseTestModuleAsDefault = isNil(serverOptions?.tests?.requiresModuleAsDefault) ?
        true :
        !!serverOptions?.tests?.requiresModuleAsDefault;
    const shouldHaveTestsEverywhere = isNil(serverOptions?.tests?.requiresTestsEverywhere) ?
        true :
        !!serverOptions?.tests?.requiresTestsEverywhere;
    const shouldAllowEmptyTestSettings = !!serverOptions?.tests?.allowEmptyTestSettings;

    let errorHandler: HttpErrorHandler = defaultHttpErrorHandler;
    const globalMiddlewares: HttpMiddleware[] = [];
    let instance: Optional<Server>;
    let notFoundHandler: HttpNotFoundHandler = defaultHttpNotFoundHandler;

    const getErrorHandler = () => {
        return errorHandler;
    };

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
            let context: Optional<IRequestHandlerContext>;

            const methodContextes = compiledHandlers[request.method!];
            const methodContextCount = methodContextes?.length ?? 0;

            for (let i = 0; i < methodContextCount; i++) {
                const ctx = methodContextes[i];

                // eslint-disable-next-line @typescript-eslint/await-thenable
                if (await ctx.isPathValid(request)) {
                    context = ctx;
                    break;
                }
            }

            if (context) {
                await context.handler(request as IHttpRequest, response as IHttpResponse);

                context.end(response);
            }
            else {
                notFoundHandler(request, response)
                    .catch(logError);
            }
        }
        catch (error) {
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
                    typeof path === "string" ||
                    path instanceof RegExp ||
                    typeof path === "function"
                )
            ) {
                throw new TypeError("path must be of type string, function or RegExp");
            }

            let optionsOrMiddlewares: Nilable<HttpOptionsOrMiddlewares>;
            let handler: HttpRequestHandler;
            if (args.length < 3) {
                // args[1]: HttpRequestHandler
                handler = args[1];
            }
            else {
                // args[1]: HttpOptionsOrMiddlewares
                // args[2]: HttpRequestHandler
                optionsOrMiddlewares = args[1];
                handler = args[2];
            }

            if (typeof handler !== "function") {
                throw new TypeError("handler must be a function");
            }

            // keep sure to have an async function here
            handler = asAsync<HttpRequestHandler>(handler);

            let options: IHttpRequestHandlerOptions;
            if (optionsOrMiddlewares) {
                if (Array.isArray(optionsOrMiddlewares)) {
                    // list of middlewares
                    options = {
                        "use": optionsOrMiddlewares
                    };
                }
                else if (typeof optionsOrMiddlewares === "function") {
                    // single middleware
                    options = {
                        "use": [optionsOrMiddlewares]
                    };
                }
                else {
                    // options object
                    options = optionsOrMiddlewares;
                }
            }
            else {
                options = {};
            }

            if (typeof options !== "object") {
                throw new TypeError("optionsOrMiddlewares must be an object or array");
            }

            const middlewares = options.use?.filter(mw => {
                return !!mw;
            });
            if (middlewares?.length) {
                if (!middlewares.every(mw => {
                    return typeof mw === "function";
                })) {
                    throw new TypeError("optionsOrMiddlewares.use must be an array of functions");
                }
            }

            if (!groupedHandlers[method]) {
                // group is not initialized yet
                groupedHandlers[method] = [];
            }

            // eslint-disable-next-line @typescript-eslint/naming-convention
            const autoEnd = isNil(options.autoEnd) ? true : options.autoEnd;
            if (typeof autoEnd !== "boolean") {
                throw new TypeError("optionsOrMiddlewares.autoEnd must be boolean");
            }

            // path validator
            let isPathValid: HttpPathValidator;
            if (typeof path === "function") {
                isPathValid = path;
            }
            else if (path instanceof RegExp) {
                isPathValid = isPathValidByRegex(path);
            }
            else {
                isPathValid = isPathValidByString(path);
            }

            groupedHandlers[method].push({
                "end": autoEnd ? endRequest : doNotEndRequest,
                handler,
                "isPathValid": asAsync<HttpPathValidator>(isPathValid),
                "middlewares": middlewares?.map(mw => {
                    return asAsync<HttpMiddleware>(mw);
                })
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
        if (typeof handler !== "function") {
            throw new TypeError("handler must be a function");
        }

        // keep sure to have an async function here
        errorHandler = asAsync(handler);

        return server;
    };

    server.setNotFoundHandler = (handler) => {
        if (typeof handler !== "function") {
            throw new TypeError("handler must be a function");
        }

        // keep sure to have an async function here
        notFoundHandler = asAsync(handler);

        return server;
    };

    server.use = (...middlewares: HttpMiddleware[]) => {
        const moreMiddlewares = middlewares.filter(mw => {
            return !!mw;
        });
        if (!moreMiddlewares.every(mw => {
            return typeof mw === "function";
        })) {
            throw new TypeError("middlewares must be a list of functions");
        }

        // keep sure to have an async functions here
        globalMiddlewares.push(...moreMiddlewares.map(mw => {
            return asAsync<HttpMiddleware>(mw);
        }));

        recompileHandlers();

        return server;
    };

    server.listen = (port?) => {
        if (typeof port === "string") {
            port = port.trim();

            if (port?.length) {
                port = parseInt(port);
            }
            else {
                port = undefined;
            }
        }

        if (isNil(port)) {
            if (process.env.NODE_ENV?.toLowerCase().trim() === "development") {
                port = 8080;
            }
            else {
                port = 80;
            }
        }

        if (typeof port !== "number" || isNaN(port) || port < 0 || port > 65535) {
            throw new TypeError("port must be a valid number between 0 and 65535");
        }

        return new Promise<void>((resolve, reject) => {
            const newInstance = createHttpServer(server);

            newInstance.once("error", ex => {
                resetInstance();

                reject(ex);
            });

            const finalize = () => {
                (server as any).port = port;

                resolve(undefined);
            };

            if (isTruthy(process.env.EGO_RUN_TESTS)) {
                // run tests instead of creating a new instance

                finalize();

                server.test()
                    .then(resolve)
                    .catch(reject);
            }
            else {
                newInstance.listen(port as number, "0.0.0.0", finalize);
            }

            instance = newInstance;
        });
    };

    server.close = () => {
        return new Promise((resolve, reject) => {
            instance!.close((ex) => {
                if (ex) {
                    reject(ex);
                }
                else {
                    resetInstance();

                    resolve(undefined);
                }
            });
        });
    };

    (server as any).isEgoHttpServer = true;

    // server.errorHandler
    Object.defineProperty(server, "errorHandler", {
        "enumerable": true,
        "get": () => {
            return errorHandler;
        }
    });

    // server.notFoundHandler
    Object.defineProperty(server, "notFoundHandler", {
        "enumerable": true,
        "get": () => {
            return notFoundHandler;
        }
    });

    // server.instance
    Object.defineProperty(server, "instance", {
        "enumerable": true,
        "get": () => {
            return instance ?? null;
        }
    });

    setupHttpServerControllerMethod({
        server,
        shouldAllowEmptyTestSettings,
        shouldHaveTestsEverywhere,
        shouldUseTestModuleAsDefault,
        testTimeout
    });
    setupEventMethods(server);
    setupHttpServerTestMethod({
        "options": serverOptions,
        server
    });

    resetInstance();

    return server;
}

/**
 * Checks if a value is an `UniqueHttpMiddleware`.
 *
 * @param {any} val The value to check.
 * @param {Nilable<symbol>} [id] If defined, also check `middleware` key for this value.
 *
 * @returns {boolean} Is of type `UniqueHttpMiddleware` or not.
 */
export function isUniqueHttpMiddleware(val: any, id?: Nilable<symbol>): val is UniqueHttpMiddleware {
    if (isNil(id)) {
        return typeof val === "function" &&
            typeof val[middleware] === "symbol";
    }
    else {
        return typeof val === "function" &&
            val[middleware] === id;
    }
}

/**
 * A symbol for a key inside an object, which stores the ID of a middleware.
 */
export const middleware: unique symbol = Symbol("middleware");

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
        compiledHandlers[method] = groupedHandlers[method].map(ctx => {
            return {
                "end": ctx.end,
                "handler": mergeHandler(
                    ctx.handler,
                    [
                        ...globalMiddlewares,  // global middles
                        ...(ctx.middlewares?.length ? ctx.middlewares : [])  // route specific middlewares
                    ],
                    getErrorHandler
                ),
                "isPathValid": ctx.isPathValid
            };
        });
    }

    return compiledHandlers;
}

function doNotEndRequest() { }

function endRequest(response: ServerResponse) {
    response.end();
}

function isPathValidByRegex(path: RegExp): HttpPathValidator {
    return async (req: IncomingMessage) => {
        return path.test(getUrlWithoutQuery(req.url)!);
    };
}

function isPathValidByString(path: string): HttpPathValidator {
    return async (req: IncomingMessage) => {
        return getUrlWithoutQuery(req.url) === path;
    };
}

function logError(error: any) {
    console.error("[ERROR]", "HTTP Server:", error);
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
            const handleError = (error: any) => {
                return getErrorHandler()(
                    error, request, response
                );
            };

            let i = -1;

            const next: NextFunction = (error?) => {
                try {
                    if (!error) {
                        const mw = middlewares[++i];

                        if (mw) {
                            mw(request, response, next)
                                .catch(handleError)
                                .catch(reject);
                        }
                        else {
                            handler(request, response)
                                .then(resolve)
                                .catch(handleError)
                                .catch(reject);
                        }
                    }
                    else {
                        handleError(error)
                            .catch(reject);
                    }
                }
                catch (ex) {
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
} from "joi";
export {
    OpenAPIV3
} from "openapi-types";
export * from "./controllers";
export * from "./errors";
export * from "./middlewares";
export * from "./types";
export * from "./validators";

export const schema = joi;


// </EXPORTS>
