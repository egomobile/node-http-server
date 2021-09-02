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

import fs from 'fs';
import minimatch from 'minimatch';
import path from 'path';
import { OpenAPIV3 } from 'openapi-types';
import { isSchema } from 'joi';
import { CONTROLLERS_CONTEXES, ERROR_HANDLER, HTTP_METHODS, INIT_CONTROLLER_METHOD_ACTIONS, INIT_SERVER_CONTROLLER_ACTIONS, IS_CONTROLLER_CLASS, RESPONSE_SERIALIZER, ROUTER_PATHS, SETUP_ERROR_HANDLER, SETUP_RESPONSE_SERIALIZER } from '../constants';
import { buffer, json, validate } from '../middlewares';
import type { ControllerRouteOptionsValue, GetterFunc, HttpErrorHandler, HttpMethod, HttpMiddleware, HttpRequestHandler, HttpRequestPath, IControllerRouteWithBodyOptions, IControllersOptions, IControllersSwaggerOptions, IHttpController, IHttpControllerOptions, IHttpServer, Nilable, ResponseSerializer } from '../types';
import type { IControllerClass, IControllerContext, IControllerFile, InitControllerErrorHandlerAction, InitControllerMethodAction, InitControllerMethodSwaggerAction, InitControllerSerializerAction } from '../types/internal';
import { asAsync, getAllClassProps, isClass, isNil, walkDirSync } from '../utils';
import { params } from '../validators/params';
import { getListFromObject, getMethodOrThrow, normalizeRouterPath } from './utils';
import { setupSwaggerUIForServerControllers } from '../swagger';

type GetContollerValue<TValue extends any = any> = (controller: IHttpController, server: IHttpServer) => TValue;

interface ICreateControllerMethodRequestHandlerOptions {
    getError: GetterFunc<HttpErrorHandler>;
    handler: HttpRequestHandler;
}

export interface ICreateHttpMethodDecoratorOptions {
    decoratorOptions: Nilable<ControllerRouteOptionsValue<IControllerRouteWithBodyOptions>>;
    name: HttpMethod;
}

interface ICreateInitControllerMethodActionOptions {
    controllerMethodName: string;
    controllerRouterPath: Nilable<string>;
    getError: GetContollerValue<HttpErrorHandler>;
    httpMethod: HttpMethod;
    middlewares: HttpMiddleware[];
    serializer: Nilable<ResponseSerializer>;
}

function createControllerMethodRequestHandler({ getError, handler }: ICreateControllerMethodRequestHandlerOptions): HttpRequestHandler {
    handler = asAsync<HttpRequestHandler>(handler);

    return async (request, response) => {
        try {
            await handler(request, response);
        } catch (error) {
            await getError()(error, request, response);
        }
    };
}

export function createHttpMethodDecorator(options: ICreateHttpMethodDecoratorOptions): MethodDecorator {
    const decoratorOptions: Nilable<IControllerRouteWithBodyOptions> =
        typeof options.decoratorOptions === 'string' ? {
            path: options.decoratorOptions
        } : options.decoratorOptions;

    if (!isNil(decoratorOptions?.limit)) {
        if (typeof decoratorOptions!.limit !== 'number') {
            throw new TypeError('decoratorOptions.limit must be of type number');
        }
    }

    if (!isNil(decoratorOptions?.path)) {
        if (typeof decoratorOptions!.path !== 'string') {
            throw new TypeError('decoratorOptions.path must be of type string');
        }
    }

    if (!isNil(decoratorOptions?.onError)) {
        if (typeof decoratorOptions!.onError !== 'function') {
            throw new TypeError('decoratorOptions.onError must be of type function');
        }
    }

    if (!isNil(decoratorOptions?.schema)) {
        if (!isSchema(decoratorOptions!.schema)) {
            throw new TypeError('decoratorOptions.schema must be a Joi object');
        }
    }

    if (!isNil(decoratorOptions?.serializer)) {
        if (typeof decoratorOptions!.serializer !== 'function') {
            throw new TypeError('decoratorOptions.serializer must be of type function');
        }
    }

    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        let httpMethods: Nilable<HttpMethod[]> = (method as any)[HTTP_METHODS];
        if (!httpMethods) {
            (method as any)[HTTP_METHODS] = httpMethods = [];
        }
        if (!httpMethods.includes(options.name)) {
            httpMethods.push(options.name);
        }
        httpMethods.sort();

        const middlewares = (
            Array.isArray(decoratorOptions?.use) ?
                decoratorOptions!.use :
                [decoratorOptions?.use]
        ).filter(mw => !isNil(mw)) as HttpMiddleware[];

        if (decoratorOptions?.schema) {
            if (['get', 'head', 'options'].includes(options.name)) {
                throw new Error(`Cannot use schema with ${options.name.toUpperCase()} requests`);
            }

            middlewares.push(
                json({
                    limit: decoratorOptions?.limit
                }),
                validate(decoratorOptions?.schema)
            );
        } else {
            if (typeof decoratorOptions?.limit === 'number') {
                middlewares.push(
                    buffer({
                        limit: decoratorOptions.limit
                    }),
                );
            }
        }

        getListFromObject<InitControllerMethodAction>(method, INIT_CONTROLLER_METHOD_ACTIONS).push(
            createInitControllerMethodAction({
                controllerMethodName: String(methodName).trim(),
                controllerRouterPath: decoratorOptions?.path,
                httpMethod: options.name,
                middlewares,
                getError: (controller, server) => decoratorOptions?.onError ||
                    (controller as any)[ERROR_HANDLER] ||
                    server.errorHandler,
                serializer: decoratorOptions?.serializer
            })
        );
    };
}

function createInitControllerMethodAction({
    controllerMethodName,
    controllerRouterPath,
    getError,
    httpMethod,
    middlewares,
    serializer
}: ICreateInitControllerMethodActionOptions): InitControllerMethodAction {
    return ({ controller, relativeFilePath, method, server }) => {
        const dir = path.dirname(relativeFilePath);
        const fileName = path.basename(relativeFilePath, path.extname(relativeFilePath));

        let routerPath: HttpRequestPath = dir;
        if (fileName !== 'index') {
            routerPath += `/${fileName}`;
        }

        if (controllerRouterPath?.length) {
            routerPath += normalizeRouterPath(controllerRouterPath);
        } else {
            if (controllerMethodName.length && controllerMethodName !== 'index') {
                routerPath += `/${controllerMethodName}`;
            }
        }

        routerPath = normalizeRouterPath(routerPath);
        routerPath = routerPath.split('/@').join('/:');

        let allRouterPaths: Nilable<string[]> = (method as any)[ROUTER_PATHS];
        if (!allRouterPaths) {
            (method as any)[ROUTER_PATHS] = allRouterPaths = [];
        }
        if (!allRouterPaths.includes(routerPath)) {
            allRouterPaths.push(routerPath);
        }

        if (routerPath.includes('/:')) {
            routerPath = params(routerPath);
        }

        (server as any)[httpMethod](routerPath, middlewares, createControllerMethodRequestHandler({
            getError: () => getError(controller, server),
            handler: createRequestHandlerWithSerializer(
                method as HttpRequestHandler,
                () => serializer ||
                    (controller as any)[RESPONSE_SERIALIZER]
            )
        }));
    };
}

function createRequestHandlerWithSerializer(handler: HttpRequestHandler, getSerializer: GetterFunc<Nilable<ResponseSerializer>>): HttpRequestHandler {
    handler = asAsync(handler);

    return async (request, response) => {
        const serializer = getSerializer();

        if (serializer) {
            await serializer(
                await handler(request, response),
                request, response
            );
        } else {
            await handler(request, response);
        }
    };
}

export function setupHttpServerControllerMethod(server: IHttpServer) {
    server.controllers = (...args: any[]) => {
        const isTypeScript = __filename.endsWith('.ts');

        const newControllersContext: IControllerContext = {
            controllers: []
        };

        let options: Nilable<IControllersOptions>;

        if (args.length) {
            if (typeof args[0] === 'string') {
                options = {
                    rootDir: args[0]
                };
            } else if (typeof args[0] === 'object') {
                options = args[0];
            } else {
                throw new TypeError('Argument must be of type string or object');
            }
        }

        if (!options) {
            options = {};
        }

        let swagger: Nilable<IControllersSwaggerOptions>;
        if (!isNil(options.swagger)) {
            if (options.swagger !== false) {
                if (typeof options.swagger === 'object') {
                    if (!isNil(options.swagger.basePath)) {
                        if (typeof options.swagger.basePath !== 'string') {
                            throw new TypeError('options.swagger.basePath must be of type string');
                        }
                    }

                    swagger = options.swagger;
                } else {
                    throw new TypeError('options.swagger must be of type object or must be the value false');
                }
            }
        }

        const swaggerDoc: OpenAPIV3.Document = {
            ...(swagger?.document ? swagger.document : {
                info: {
                    title: 'OpenAPI documentation with @egomobile/http-server by e.GO Mobile',
                    version: '0.0.1'
                }
            }),

            openapi: '3.0.3',
            paths: {}
        };

        let rootDir: string;
        if (isNil(options.rootDir)) {
            rootDir = path.join(process.cwd(), 'controllers');
        } else {
            if (typeof options.rootDir !== 'string') {
                throw new TypeError('options.rootDir must be of type string');
            }

            if (path.isAbsolute(options.rootDir)) {
                rootDir = options.rootDir;
            } else {
                rootDir = path.join(process.cwd(), options.rootDir);
            }
        }

        if (!fs.existsSync(rootDir)) {
            throw new Error(`Directory ${rootDir} does not exist`);
        }
        if (!fs.statSync(rootDir).isDirectory()) {
            throw new Error(`${rootDir} is no directory`);
        }

        const patterns: string[] = [];
        if (!isNil(options.patterns)) {
            if (Array.isArray(options.patterns)) {
                patterns.push(...options.patterns);
            } else {
                patterns.push(options.patterns);
            }
        }

        if (!patterns.length) {
            patterns.push(isTypeScript ? '*.+(js|ts)' : '*.js');
        }

        if (!patterns.every(p => typeof p === 'string')) {
            throw new TypeError('All elements of options.patterns must be of type string');
        }

        const minimatchOpts: minimatch.IOptions = {
            dot: false,
            matchBase: true
        };

        // collect matching files
        const controllerFiles: IControllerFile[] = [];
        walkDirSync(rootDir, (file) => {
            const relativePath = normalizeRouterPath(
                path.relative(rootDir, file)
            );

            if (!patterns.some(p => minimatch(relativePath, p, minimatchOpts))) {
                return;  // does not match pattern
            }

            controllerFiles.push({
                fullPath: file,
                relativePath
            });
        });

        if (!controllerFiles.length) {
            throw new Error(`No controller files found in ${rootDir}`);
        }

        controllerFiles.sort();

        const controllerClasses: IControllerClass[] = [];

        controllerFiles.forEach(file => {
            const controllerModule = require(file.fullPath);
            const controllerClass: Nilable<IHttpController> = controllerModule.default;

            if (!isNil(controllerClass)) {
                if (isClass<IHttpController>(controllerClass)) {
                    if ((controllerClass.prototype as any)[IS_CONTROLLER_CLASS]) {
                        // only if marked as class

                        controllerClasses.push({
                            class: controllerClass,
                            file
                        });
                    }
                } else {
                    throw new TypeError(`Default export in ${file.fullPath} must be of type class`);
                }
            }
        });

        if (!controllerClasses.length) {
            throw new Error(`No controllers found in ${rootDir}`);
        }

        controllerClasses.forEach(cls => {
            const contollerOptions: IHttpControllerOptions = {
                app: server,
                file: cls.file.fullPath,
                path: cls.file.relativePath
            };

            const controller = new cls['class'](contollerOptions);

            const classProps = getAllClassProps(cls['class']);
            classProps.forEach(prop => {
                if (prop.trimStart().startsWith('_')) {
                    return;  // ignore all props with leading _
                }

                const propValue: unknown = (controller as any)[prop];
                if (typeof propValue === 'function') {
                    if (prop === 'constructor') {
                        return;
                    }

                    getListFromObject<InitControllerMethodAction>(propValue, INIT_CONTROLLER_METHOD_ACTIONS).forEach(action => {
                        action({
                            controller,
                            controllerClass: cls['class'],
                            fullFilePath: cls.file.fullPath,
                            method: propValue,
                            relativeFilePath: cls.file.relativePath,
                            server
                        });
                    });

                    getListFromObject<InitControllerErrorHandlerAction>(propValue, SETUP_ERROR_HANDLER).forEach((action) => {
                        action({
                            controller
                        });
                    });

                    getListFromObject<InitControllerSerializerAction>(propValue, SETUP_RESPONSE_SERIALIZER).forEach((action) => {
                        action({
                            controller
                        });
                    });

                    getListFromObject<InitControllerMethodSwaggerAction>(propValue, INIT_SERVER_CONTROLLER_ACTIONS).forEach(action => {
                        action({
                            apiDocument: swaggerDoc
                        });
                    });
                }
            });

            newControllersContext.controllers.push({
                controller,
                controllerClass: cls
            });
        });

        if (swagger) {
            setupSwaggerUIForServerControllers(server, swaggerDoc, swagger);

            newControllersContext.swagger = swaggerDoc;
        }

        getListFromObject<IControllerContext>(server, CONTROLLERS_CONTEXES).push(
            newControllersContext
        );

        return server;
    };
}
