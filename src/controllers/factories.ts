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
import { isSchema } from 'joi';
import minimatch from 'minimatch';
import type { OpenAPIV3 } from 'openapi-types';
import path from 'path';
import { CONTROLLERS_CONTEXES, CONTROLLER_MIDDLEWARES, DOCUMENTATION_UPDATER, ERROR_HANDLER, HTTP_METHODS, INIT_CONTROLLER_METHOD_ACTIONS, INIT_CONTROLLER_METHOD_SWAGGER_ACTIONS, IS_CONTROLLER_CLASS, RESPONSE_SERIALIZER, ROUTER_PATHS, SETUP_DOCUMENTATION_UPDATER, SETUP_ERROR_HANDLER, SETUP_RESPONSE_SERIALIZER, SETUP_VALIDATION_ERROR_HANDLER, SWAGGER_METHOD_INFO, VALIDATION_ERROR_HANDLER } from '../constants';
import { buffer, defaultValidationFailedHandler, json, query, validate } from '../middlewares';
import { setupSwaggerUIForServerControllers } from '../swagger';
import { toSwaggerPath } from '../swagger/utils';
import { ControllerRouteArgument1, ControllerRouteArgument2, ControllerRouteArgument3, DocumentationUpdaterHandler, GetterFunc, HttpErrorHandler, HttpInputDataFormat, HttpMethod, HttpMiddleware, HttpRequestHandler, HttpRequestPath, IControllerRouteWithBodyOptions, IControllersOptions, IControllersSwaggerOptions, IHttpController, IHttpControllerOptions, IHttpServer, Nilable, ResponseSerializer, ValidationFailedHandler } from '../types';
import type { IControllerClass, IControllerContext, IControllerFile, InitControllerErrorHandlerAction, InitControllerMethodAction, InitControllerMethodSwaggerAction, InitControllerSerializerAction, InitControllerValidationErrorHandlerAction, InitDocumentationUpdaterAction, ISwaggerMethodInfo } from '../types/internal';
import { asAsync, getAllClassProps, isClass, isNil, limitToBytes, sortObjectByKeys, walkDirSync } from '../utils';
import { params } from '../validators/params';
import { createBodyParserMiddlewareByFormat, getListFromObject, getMethodOrThrow, normalizeRouterPath } from './utils';

type GetContollerValue<TValue extends any = any> = (controller: IHttpController, server: IHttpServer) => TValue;

interface ICreateControllerMethodRequestHandlerOptions {
    getErrorHandler: GetterFunc<HttpErrorHandler>;
    handler: HttpRequestHandler;
}

export interface ICreateHttpMethodDecoratorOptions {
    decoratorOptions: {
        arg1: Nilable<ControllerRouteArgument1<IControllerRouteWithBodyOptions>>;
        arg2: Nilable<ControllerRouteArgument2>;
        arg3: Nilable<ControllerRouteArgument3>;
    };
    name: HttpMethod;
}

interface ICreateInitControllerMethodActionOptions {
    controllerMethodName: string;
    controllerRouterPath: Nilable<string>;
    getErrorHandler: GetContollerValue<HttpErrorHandler>;
    httpMethod: HttpMethod;
    middlewares: HttpMiddleware[];
    serializer: Nilable<ResponseSerializer>;
    updateMiddlewares: (options: IUpdateMiddlewaresOptions) => void;
}

interface ICreateInitControllerMethodSwaggerActionOptions {
    doc: OpenAPIV3.OperationObject;
    method: Function;
    methodName: string | symbol;
}

interface IUpdateMiddlewaresOptions {
    controller: IHttpController<IHttpServer>;
    globalOptions: Nilable<IControllersOptions>;
    middlewares: HttpMiddleware[];
}

function createControllerMethodRequestHandler({ getErrorHandler, handler }: ICreateControllerMethodRequestHandlerOptions): HttpRequestHandler {
    handler = asAsync<HttpRequestHandler>(handler);

    return async (request, response) => {
        try {
            await handler(request, response);
        } catch (error) {
            await getErrorHandler()(error, request, response);
        }
    };
}

export function createHttpMethodDecorator(options: ICreateHttpMethodDecoratorOptions): MethodDecorator {
    const throwIfOptionsIncompatibleWithHTTPMethod = () => {
        if (!['post', 'put', 'patch'].includes(options.name)) {
            throw new Error(`Cannot use schema with ${options.name.toUpperCase()} requests`);
        }
    };

    const { arg1, arg2, arg3 } = options.decoratorOptions;

    let decoratorOptions: Nilable<IControllerRouteWithBodyOptions>;

    if (!isNil(arg1)) {
        if (isSchema(arg1)) {
            // [arg1] AnySchema
            // [arg2] number
            decoratorOptions = { schema: arg1 };

            if (!isNil(arg2)) {
                if (typeof arg2 === 'number') {
                    decoratorOptions.limit = limitToBytes(arg2);
                } else {
                    throw new TypeError('arg2 must be of type number');
                }
            }
        } else if (typeof arg1 === 'string') {
            // [arg1] string
            decoratorOptions = { path: arg1 };

            if (!isNil(arg2)) {
                if (Array.isArray(arg2)) {
                    // [arg2] HttpMiddleware[]
                    decoratorOptions.use = arg2;
                } else if (isSchema(arg2)) {
                    // [arg2] AnySchema
                    // [arg3] number

                    decoratorOptions.schema = arg2;

                    if (!isNil(arg3)) {
                        if (typeof arg3 === 'number') {
                            decoratorOptions.limit = limitToBytes(arg3);
                        } else {
                            throw new TypeError('arg3 must be of type number');
                        }
                    }
                } else {
                    throw new TypeError('arg2 must be of type array or schema');
                }
            }
        } else if (Array.isArray(arg1)) {
            // [arg1] HttpMiddleware[]
            decoratorOptions = { use: arg1 };
        } else if (typeof arg1 === 'number') {
            // [arg1] number
            decoratorOptions = { limit: limitToBytes(arg1) };

            if (!isNil(arg2)) {
                // [arg2] HttpInputDataFormat

                if (Object.values(HttpInputDataFormat).includes(arg2 as any)) {
                    decoratorOptions.format = arg2 as HttpInputDataFormat;
                } else {
                    throw new TypeError('arg2 must be of type HttpInputDataFormat');
                }
            }
        } else if (typeof arg1 === 'object') {
            // [arg1] IControllerRouteOptions | IControllerRouteWithBodyOptions
            decoratorOptions = arg1;
        } else {
            throw new TypeError('arg1 must be of type array, number, object, schema or string');
        }
    }

    if (!isNil(decoratorOptions)) {
        if (typeof decoratorOptions !== 'object') {
            throw new TypeError('decoratorOptions must be of type object');
        }
    }

    if (!isNil(decoratorOptions?.limit)) {
        if (typeof decoratorOptions?.limit !== 'number') {
            throw new TypeError('decoratorOptions.limit must be of type number');
        }
    }

    if (!isNil(decoratorOptions?.path)) {
        if (typeof decoratorOptions?.path !== 'string') {
            throw new TypeError('decoratorOptions.path must be of type string');
        }
    }

    if (!isNil(decoratorOptions?.onError)) {
        if (typeof decoratorOptions?.onError !== 'function') {
            throw new TypeError('decoratorOptions.onError must be of type function');
        }
    }

    if (!isNil(decoratorOptions?.onValidationFailed)) {
        if (typeof decoratorOptions?.onValidationFailed !== 'function') {
            throw new TypeError('decoratorOptions.onValidationFailed must be of type function');
        }
    }

    if (!isNil(decoratorOptions?.schema)) {
        if (!isSchema(decoratorOptions?.schema)) {
            throw new TypeError('decoratorOptions.schema must be a Joi object');
        }
    }

    if (!isNil(decoratorOptions?.serializer)) {
        if (typeof decoratorOptions?.serializer !== 'function') {
            throw new TypeError('decoratorOptions.serializer must be of type function');
        }
    }

    if (!isNil(decoratorOptions?.documentation)) {
        if (typeof decoratorOptions?.documentation !== 'object') {
            throw new TypeError('decoratorOptions.documentation must be of type object');
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

        const middlewares: HttpMiddleware[] = [];

        middlewares.push(
            ...(
                Array.isArray(decoratorOptions?.use) ? (decoratorOptions?.use as HttpMiddleware[]) : [decoratorOptions?.use]
            ).filter(mw => !isNil(mw)) as HttpMiddleware[]
        );

        if (
            !decoratorOptions?.schema &&
            typeof decoratorOptions?.limit === 'number'
        ) {
            throwIfOptionsIncompatibleWithHTTPMethod();

            const createDataParser = isNil(decoratorOptions.format) ?
                () => buffer({
                    limit: decoratorOptions?.limit
                }) :
                () => createBodyParserMiddlewareByFormat(decoratorOptions?.format || HttpInputDataFormat.Binary, {
                    limit: decoratorOptions?.limit
                });

            middlewares.push(createDataParser());
        }

        getListFromObject<InitControllerMethodAction>(method, INIT_CONTROLLER_METHOD_ACTIONS).push(
            createInitControllerMethodAction({
                controllerMethodName: String(methodName).trim(),
                controllerRouterPath: decoratorOptions?.path,
                httpMethod: options.name,
                middlewares,
                getErrorHandler: (controller, server) => decoratorOptions?.onError ||
                    (controller as any)[ERROR_HANDLER] ||
                    server.errorHandler,
                serializer: decoratorOptions?.serializer,
                updateMiddlewares: ({ controller, globalOptions, middlewares }) => {
                    // use query() middleware?
                    let shouldAddQueryMiddleware = true;
                    if (isNil(decoratorOptions?.noQueryParams)) {
                        shouldAddQueryMiddleware = !globalOptions?.noQueryParams;
                    } else {
                        shouldAddQueryMiddleware = !decoratorOptions?.noQueryParams;
                    }

                    // schema?
                    if (decoratorOptions?.schema) {
                        throwIfOptionsIncompatibleWithHTTPMethod();

                        const validationErrorHandler =
                            createWrappedValidationErrorHandler(
                                decoratorOptions?.onValidationFailed ||
                                (controller as any)[VALIDATION_ERROR_HANDLER]
                            ) || defaultValidationFailedHandler;

                        const createDataParser: () => HttpMiddleware = isNil(decoratorOptions?.format) ?
                            () => json({
                                limit: decoratorOptions?.limit
                            }) :
                            () => createBodyParserMiddlewareByFormat(decoratorOptions?.format || HttpInputDataFormat.JSON, {
                                limit: decoratorOptions?.limit
                            });

                        middlewares.push(
                            createDataParser(),
                            validate(decoratorOptions.schema, {
                                onValidationFailed: validationErrorHandler
                            })
                        );
                    }

                    if (shouldAddQueryMiddleware) {
                        middlewares.unshift(query());  // add query parser to beginning
                    }
                }
            })
        );

        if (decoratorOptions?.documentation) {
            getListFromObject<InitControllerMethodSwaggerAction>(method, INIT_CONTROLLER_METHOD_SWAGGER_ACTIONS).push(
                createInitControllerMethodSwaggerAction({
                    doc: JSON.parse(
                        JSON.stringify(decoratorOptions.documentation)
                    ),
                    method,
                    methodName
                })
            );
        }
    };
}

function createInitControllerMethodAction({
    controllerMethodName,
    controllerRouterPath,
    getErrorHandler,
    httpMethod,
    middlewares,
    serializer,
    updateMiddlewares
}: ICreateInitControllerMethodActionOptions): InitControllerMethodAction {
    return ({ controller, controllerClass, relativeFilePath, method, server, globalOptions }) => {
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

        updateMiddlewares({
            controller,
            middlewares,
            globalOptions
        });

        if (controllerClass.prototype[CONTROLLER_MIDDLEWARES]) {
            // add controler wide middlewares
            // at the beginning of the list
            middlewares.unshift(...controllerClass.prototype[CONTROLLER_MIDDLEWARES]);
        }

        (server as any)[httpMethod](routerPath, middlewares, createControllerMethodRequestHandler({
            getErrorHandler: () => getErrorHandler(controller, server),
            handler: createRequestHandlerWithSerializer(
                (method as HttpRequestHandler).bind(controller),
                () => serializer || (controller as any)[RESPONSE_SERIALIZER]
            )
        }));
    };
}

function createInitControllerMethodSwaggerAction({ doc, method, methodName }: ICreateInitControllerMethodSwaggerActionOptions): InitControllerMethodSwaggerAction {
    return ({ apiDocument, controller }) => {
        const info: ISwaggerMethodInfo = {
            doc,
            method
        };

        (method as any)[SWAGGER_METHOD_INFO] = info;

        const routerPaths: Nilable<string[]> = (method as any)[ROUTER_PATHS];
        if (routerPaths?.length) {
            const httpMethods: Nilable<HttpMethod[]> = (method as any)[HTTP_METHODS];

            let paths = apiDocument.paths!;

            if (httpMethods?.length) {
                routerPaths.forEach(routerPath => {
                    const swaggerPath = toSwaggerPath(routerPath);

                    httpMethods!.forEach(httpMethod => {
                        let pathObj: any = paths[swaggerPath];
                        if (!pathObj) {
                            pathObj = {};
                        }

                        let methodObj: any = pathObj[httpMethod];
                        if (methodObj) {
                            throw new Error(`Cannot reset documentation for route ${routerPath} (${httpMethod.toUpperCase()})`);
                        }

                        const docUpdater: Nilable<DocumentationUpdaterHandler> = (controller as any)[DOCUMENTATION_UPDATER];
                        if (docUpdater) {
                            docUpdater({
                                documentation: doc,
                                method: httpMethod.toUpperCase() as Uppercase<HttpMethod>,
                                path: routerPath
                            });
                        }

                        pathObj[httpMethod] = doc;

                        paths[swaggerPath] = sortObjectByKeys(pathObj);
                    });
                });
            }

            apiDocument.paths = sortObjectByKeys(paths);
        }
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

function createWrappedValidationErrorHandler(handler: Nilable<ValidationFailedHandler>): Nilable<ValidationFailedHandler> {
    if (isNil(handler)) {
        return handler;
    }

    handler = asAsync<ValidationFailedHandler>(handler);

    return async (error, request, response) => {
        await handler!(error, request, response);

        response.end();
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
                        return;  // not the constructor
                    }

                    // controller methods
                    getListFromObject<InitControllerMethodAction>(propValue, INIT_CONTROLLER_METHOD_ACTIONS).forEach(action => {
                        action({
                            controller,
                            controllerClass: cls['class'],
                            fullFilePath: cls.file.fullPath,
                            method: propValue,
                            relativeFilePath: cls.file.relativePath,
                            server,
                            globalOptions: options
                        });
                    }, true);

                    // error handlers
                    getListFromObject<InitControllerErrorHandlerAction>(propValue, SETUP_ERROR_HANDLER).forEach((action) => {
                        action({
                            controller
                        });
                    }, true);

                    // schema validators
                    getListFromObject<InitControllerValidationErrorHandlerAction>(propValue, SETUP_VALIDATION_ERROR_HANDLER).forEach((action) => {
                        action({
                            controller
                        });
                    }, true);

                    // response serializer
                    getListFromObject<InitControllerSerializerAction>(propValue, SETUP_RESPONSE_SERIALIZER).forEach((action) => {
                        action({
                            controller
                        });
                    }, true);

                    // Swagger documentation updater method / action
                    getListFromObject<InitDocumentationUpdaterAction>(propValue, SETUP_DOCUMENTATION_UPDATER).forEach(action => {
                        action({
                            controller
                        });
                    }, true);

                    // Swagger documentation
                    getListFromObject<InitControllerMethodSwaggerAction>(propValue, INIT_CONTROLLER_METHOD_SWAGGER_ACTIONS).forEach(action => {
                        action({
                            apiDocument: swaggerDoc,
                            controller
                        });
                    }, true);
                }
            });

            newControllersContext.controllers.push({
                controller,
                controllerClass: cls
            });
        });

        if (swagger) {
            setupSwaggerUIForServerControllers({
                server,
                document: swaggerDoc,
                options: swagger
            });

            newControllersContext.swagger = swaggerDoc;
        }

        getListFromObject<IControllerContext>(server, CONTROLLERS_CONTEXES).push(
            newControllersContext
        );

        return server;
    };
}
