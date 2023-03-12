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
import { httpMethods } from "../index.js";
import type { HttpMethod, HttpNotFoundHandler, HttpServerEventListener, IHttpRequestHandlerOptions, IHttpServer, IHttpServerExtenderContext, IHttpServerHasBeenClosedEventContext, IHttpServerIsClosingEventContext, NextFunction, HttpPathValidator as _Http1PathValidator, HttpMiddleware as _HttpMiddleware, HttpRequestHandler as _HttpRequestHandler, HttpRequestPath as _HttpRequestPath } from "../types/index.js";
import type { IHttpRequestHandlerContext, Nilable, Optional, RequestHandlerContextEndMethod as _RequestHandlerContextEndMethod } from "../types/internal.js";
import { asAsync, getUrlWithoutQuery } from "../utils/internal.js";
import { params } from "../validators/params.js";

type RequestHandlerContextEndMethod = _RequestHandlerContextEndMethod<any>;

type HttpPathValidator = _Http1PathValidator<any>;

type HttpMiddleware = _HttpMiddleware<any, any>;

type HttpRequestHandler = _HttpRequestHandler<any, any>;

type HttpRequestHandlerContext = IHttpRequestHandlerContext<any, any>;

type HttpRequestHandlerOptions = IHttpRequestHandlerOptions<any, any>;

type HttpRequestPath = _HttpRequestPath<any>;

interface ICreateRequestHandlerOptions {
    compiledHandlers: Partial<Record<Uppercase<HttpMethod>, HttpRequestHandlerContext[]>>;
    getErrorHandler(): RequestErrorHandler<any, any>;
    getNotFoundHandler(): HttpNotFoundHandler<any, any>;
}

interface IGetEndMethodOptions {
    shouldNotDoAutoEnd: boolean;
}

interface IMergeHandlerOptions {
    context: HttpRequestHandlerContext;
    globalMiddlewares: HttpMiddleware[];
}

interface IRecompileHandlersOptions {
    compiledHandlers: Record<string, HttpRequestHandlerContext[]>;
    globalMiddlewares: HttpMiddleware[];
}

interface ISetupServerInstanceOptions {
    compiledHandlers: Partial<Record<Uppercase<HttpMethod>, HttpRequestHandlerContext[]>>;
    events: NodeJS.EventEmitter;
    getInstance: () => any;
    getPort: () => Optional<number>;
    globalMiddlewares: HttpMiddleware[];
    httpVersion: number;
    onErrorHandlerUpdate: (newHandler: RequestErrorHandler<any, any>) => void;
    onNotFoundHandlerUpdate: (newHandler: HttpNotFoundHandler<any, any>) => void;
    server: IHttpServer<any, any>;
}

interface IToPathValidatorOptions {
    pathOrValidator: HttpRequestPath;
    shouldNotDoAutoParams: boolean;
}

export function createRequestHandler(options: ICreateRequestHandlerOptions) {
    const {
        compiledHandlers,
        getErrorHandler,
        getNotFoundHandler
    } = options;

    return async (request: any, response: any) => {
        try {
            let ctx: Nilable<HttpRequestHandlerContext>;

            const methodContextes = compiledHandlers[request.method as Uppercase<HttpMethod>];
            const methodContextesLength = methodContextes?.length;

            if (methodContextesLength) {
                for (let i = 0; i < methodContextesLength; i++) {
                    const context = methodContextes[i];
                    const isValid = await context.isPathValid(request);

                    if (isValid) {
                        ctx = context;
                        break;
                    }
                }
            }

            if (ctx) {
                await ctx.handler(request, response);

                await ctx.end(response);
            }
            else {
                getNotFoundHandler()(request, response)
                    .then(() => {
                        response.end();
                    })
                    .catch((ex: any) => {
                        console.error("[HTTP NOT FOUND HANDLER]", ex);

                        response.end();
                    });
            }
        }
        catch (error) {
            getErrorHandler()(error, request, response)
                .then(() => {
                    response.end();
                })
                .catch((ex: any) => {
                    console.error("[HTTP ERROR HANDLER]", ex);

                    response.end();
                });
        }
    };
}

function getEndMethod({
    shouldNotDoAutoEnd
}: IGetEndMethodOptions): RequestHandlerContextEndMethod {
    if (shouldNotDoAutoEnd) {
        return async () => { };
    }

    return async (response) => {
        response.end();
    };
}

function mergeHandler({
    context,
    globalMiddlewares
}: IMergeHandlerOptions) {
    // collect all and make then
    // async if needed
    const allMiddlewares = [
        ...globalMiddlewares,
        ...context.middlewares
    ].map((mw) => {
        return asAsync<HttpMiddleware>(mw);
    });

    // keep sure, we have an async function here
    const baseHandler = asAsync<HttpRequestHandler>(context.baseHandler);

    if (allMiddlewares.length) {
        context.handler = (request, response) => {
            return new Promise<any>((resolve, reject) => {
                let i = -1;

                const next: NextFunction = (error?) => {
                    try {
                        if (!error) {
                            const mw = allMiddlewares[++i];

                            if (mw) {
                                mw(request, response, next)
                                    .catch(reject);
                            }
                            else {
                                baseHandler(request, response)
                                    .then(resolve)
                                    .catch(reject);
                            }
                        }
                        else {
                            reject(error);
                        }
                    }
                    catch (ex) {
                        reject(ex);
                    }
                };

                next();
            });
        };
    }
    else {
        // nothing to compile, use base handler
        context.handler = baseHandler;
    }
}

function recompileHandlers({
    compiledHandlers,
    globalMiddlewares
}: IRecompileHandlersOptions) {
    for (const contextes of Object.values(compiledHandlers)) {
        for (const context of contextes) {
            mergeHandler({
                context,
                globalMiddlewares
            });
        }
    }
}

export function setupServerInstance(options: ISetupServerInstanceOptions) {
    const {
        compiledHandlers,
        events,
        getInstance,
        getPort,
        globalMiddlewares,
        httpVersion,
        onErrorHandlerUpdate,
        onNotFoundHandlerUpdate,
        server
    } = options;

    // server.extend()
    server.extend = (extender) => {
        if (typeof extender !== "function") {
            throw new TypeError("extender must be of type function");
        }

        const context: IHttpServerExtenderContext<any, any> = {
            events,

            "off": function (name: string, listener: HttpServerEventListener<any>) {
                this.events.removeListener(name, listener);

                return this;
            },
            "on": function (name: string, listener: HttpServerEventListener<any>) {
                this.events.on(name, listener);

                return this;
            },
            "once": function (name: string, listener: HttpServerEventListener<any>) {
                this.events.once(name, listener);

                return this;
            },

            server
        };

        extender(context);

        return server;
    };

    // server.close()
    server.close = async () => {
        return new Promise<boolean>((resolve, reject) => {
            const instance = getInstance();

            const port = getPort();
            const emitClosed = (error?: any) => {
                events.emit("server:closed", {
                    error,
                    port
                } as IHttpServerHasBeenClosedEventContext);
            };

            events.emit("server:close", {
                port
            } as IHttpServerIsClosingEventContext);

            if (instance) {
                instance.close((error?: any) => {
                    emitClosed(error);

                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                emitClosed();

                resolve(false);
            }
        });
    };

    // server.use()
    server.use = (...middlewares) => {
        if (middlewares.some((mw) => {
            return typeof mw !== "function";
        })) {
            throw new TypeError("All items in middlewares must be of type function");
        }

        globalMiddlewares.push(...middlewares);

        // recompile / merge all
        recompileHandlers({
            compiledHandlers,
            globalMiddlewares
        });

        return server;
    };

    // server.setErrorHandler()
    server.setErrorHandler = (handler) => {
        if (typeof handler !== "function") {
            throw new TypeError("handler must be of type function");
        }

        onErrorHandlerUpdate(
            asAsync(handler)
        );

        return server;
    };

    // server.setNotFoundHandler()
    server.setNotFoundHandler = (handler) => {
        if (typeof handler !== "function") {
            throw new TypeError("handler must be of type function");
        }

        onNotFoundHandlerUpdate(
            asAsync(handler)
        );

        return server;
    };

    // methods for
    // `connect`, `delete`, `get`, `head`, `options`, `patch`, `post`, `put`, `trace`
    httpMethods.forEach((httpMethod) => {
        const ucHttpMethod = httpMethod.toUpperCase() as Uppercase<HttpMethod>;

        (server as any)[httpMethod] = (pathOrValidator: HttpRequestPath, ...args: any[]) => {
            let options: HttpRequestHandlerOptions;
            let handler: HttpRequestHandler;

            if (args.length < 2) {
                // args[0]: Http1RequestHandler

                options = {};
                handler = args[0];
            }
            else {
                if (Array.isArray(args[0])) {
                    // args[0]: Http1Middleware[]
                    // args[1]: Http1RequestHandler

                    options = {
                        "use": args[0]
                    };
                    handler = args[1];
                }
                else {
                    // args[0]: Http1RequestHandlerOptions
                    // args[1]: Http1RequestHandler

                    options = args[0];
                    handler = args[1];
                }
            }

            const middlewares = options.use ?? [];
            const shouldNotDoAutoEnd = !!options.noAutoEnd;
            const shouldNotDoAutoParams = !!options.noAutoParams;

            const isPathValid = toPathValidator({
                pathOrValidator,
                shouldNotDoAutoParams
            });

            if (typeof handler !== "function") {
                throw new TypeError("handler must be of type function");
            }

            if (!Array.isArray(middlewares)) {
                throw new TypeError("middlewares must be of type Array");
            }
            if (middlewares.some((mw) => {
                return typeof mw !== "function";
            })) {
                throw new TypeError("All items of middlewares must be of type function");
            }

            let handlers: Optional<HttpRequestHandlerContext[]> = compiledHandlers[ucHttpMethod];
            if (!handlers) {
                handlers = compiledHandlers[ucHttpMethod] = [];
            }

            const newHandlerContext: HttpRequestHandlerContext = {
                "baseHandler": handler,
                "end": getEndMethod({
                    shouldNotDoAutoEnd
                }),
                isPathValid,
                middlewares,
                handler
            };

            handlers.push(newHandlerContext);

            // recompile / merge single context
            mergeHandler({
                "context": newHandlerContext,
                globalMiddlewares
            });

            return server;
        };
    });

    return Object.defineProperties(server, {
        "httpVersion": {
            "enumerable": true,
            "configurable": false,
            "get": () => {
                return httpVersion;
            }
        },
        "instance": {
            "enumerable": true,
            "configurable": false,
            "get": getInstance
        },
        "port": {
            "enumerable": true,
            "configurable": false,
            "get": getPort
        }
    });
}

function toPathValidator({
    pathOrValidator,
    shouldNotDoAutoParams
}: IToPathValidatorOptions): HttpPathValidator {
    let isPathValid: HttpPathValidator;

    if (typeof pathOrValidator === "string") {
        if (shouldNotDoAutoParams || !pathOrValidator.includes(":")) {
            isPathValid = async (request) => {
                return getUrlWithoutQuery(request.url) === pathOrValidator;
            };
        }
        else {
            isPathValid = params(pathOrValidator);
        }
    }
    else if (pathOrValidator instanceof RegExp) {
        isPathValid = async (request) => {
            return pathOrValidator.test(getUrlWithoutQuery(request.url));
        };
    }
    else {
        isPathValid = asAsync(pathOrValidator);
    }

    return isPathValid;
}
