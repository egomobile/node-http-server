// This file is part of the @egomobile/http-controllers distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-controllers is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-controllers is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { HttpMethod, HttpMiddleware, HttpRequestHandler, HttpRequestPath, IHttpServer, params } from "@egomobile/http-server";
import { Schema, isSchema } from "joi";
import path from "node:path";
import { INIT_METHOD_ACTIONS } from "../constants/internal.js";
import type { HttpMethodDecoratorArg1, HttpMethodDecoratorArg2, HttpMethodDecoratorArg3, HttpMethodDecoratorWithBodyArg1, HttpMethodDecoratorWithBodyArg2, HttpMethodDecoratorWithBodyArg3, HttpMethodDecoratorWithBodyInputFormat, IHttpMethodDecoratorWithBodyOptions } from "../decorators/index.js";
import { ControllerBase, ImportValues } from "../index.js";
import { buffer, json, text, validate, yaml } from "../middlewares/index.js";
import type { ClassMethodDecorator5, Nilable } from "../types/internal.js";
import { getListFromObject, isNil, normalizeRouterPath } from "../utils/internal.js";

interface ICreateHttpMethodDecoratorOptions {
    arg1: Nilable<HttpMethodDecoratorArg1 | HttpMethodDecoratorWithBodyArg1>;
    arg2: Nilable<HttpMethodDecoratorArg2 | HttpMethodDecoratorWithBodyArg2>;
    arg3?: Nilable<HttpMethodDecoratorArg3 | HttpMethodDecoratorWithBodyArg3>;
    httpMethod: HttpMethod;
}

export interface IInitImportContext {
    controller: ControllerBase;
    imports: ImportValues;
}

export interface IInitMethodContext {
    controller: ControllerBase;
    fullPath: string;
    middlewares: HttpMiddleware<any, any>[];
    noAutoEnd: Nilable<boolean>;
    noAutoParams: Nilable<boolean>;
    noAutoQuery: Nilable<boolean>;
    relativePath: string;
    server: IHttpServer<any, any>;
}

export type InitImportAction = (context: IInitImportContext) => Promise<void>;

export type InitMethodAction = (context: IInitMethodContext) => Promise<void>;

const httpMethodsSupportingSchema: HttpMethod[] = ["patch", "post", "put"];

export function createHttpMethodDecorator({
    arg1,
    arg2,
    httpMethod
}: ICreateHttpMethodDecoratorOptions): ClassMethodDecorator5 {
    let additionalMiddlewares: Nilable<HttpMiddleware<any, any>[]>;
    let bodyFormat: Nilable<HttpMethodDecoratorWithBodyInputFormat>;
    let controllerRouterPath: Nilable<string>;
    let schema: Nilable<Schema>;
    let shouldDoNoAutoEnd: Nilable<boolean>;
    let shouldDoNoAutoParams: Nilable<boolean>;
    let shouldDoNoAutoQuery: Nilable<boolean>;

    if (!isNil(arg1)) {
        if (typeof arg1 === "string") {
            // arg1: string
            // arg2: Nilable<HttpMiddleware<any, any>[]>

            controllerRouterPath = arg1;
            additionalMiddlewares = arg2 as Nilable<HttpMiddleware<any, any>[]>;
        }
        else if (Array.isArray(arg1)) {
            // arg1: Nilable<HttpMiddleware<any, any>[]>

            additionalMiddlewares = arg1 as Nilable<HttpMiddleware<any, any>[]>;
        }
        else if (isSchema(arg1)) {
            schema = arg1;
        }
        else if (typeof arg1 === "object") {
            // arg1: IHttpMethodDecoratorOptions | IHttpMethodDecoratorWithBodyOptions

            bodyFormat = (arg1 as IHttpMethodDecoratorWithBodyOptions).bodyFormat;
            controllerRouterPath = arg1.path;
            additionalMiddlewares = arg1.use;
            shouldDoNoAutoEnd = arg1.noAutoEnd;
            shouldDoNoAutoParams = arg1.noAutoParams;
            shouldDoNoAutoQuery = arg1.noAutoQuery;
        }
    }

    if (!isNil(controllerRouterPath)) {
        if (typeof controllerRouterPath !== "string") {
            throw new TypeError("path must be of type string");
        }
    }

    if (!isNil(additionalMiddlewares)) {
        if (!Array.isArray(additionalMiddlewares)) {
            throw new TypeError("use must be of type array");
        }
    }

    // create non-nil copy
    additionalMiddlewares = [...(additionalMiddlewares ?? [])];

    if (schema) {
        if (httpMethodsSupportingSchema.includes(httpMethod)) {
            let parserMiddleware: HttpMiddleware<any, any>;
            if (isNil(bodyFormat)) {
                parserMiddleware = json();
            }
            else {
                if (bodyFormat === "buffer") {
                    parserMiddleware = buffer();
                }
                else if (bodyFormat === "json") {
                    parserMiddleware = json();
                }
                else if (bodyFormat === "json5") {
                    parserMiddleware = json({ "version": 5 });
                }
                else if (bodyFormat === "text") {
                    parserMiddleware = text();
                }
                else if (bodyFormat === "yaml") {
                    parserMiddleware = yaml();
                }
                else {
                    throw new TypeError(`bodyFormat does not support value ${bodyFormat}`);
                }
            }

            additionalMiddlewares.push(
                parserMiddleware,
                validate(schema)
            );
        }
    }

    return function (target: any, context: ClassMethodDecoratorContext) {
        const controllerMethodName = String(context.name).trim();

        context.addInitializer(function () {
            const controller = this as ControllerBase;
            const method = target as Function;

            getListFromObject<InitMethodAction>(controller, INIT_METHOD_ACTIONS).push(
                async ({
                    controller,
                    "middlewares": controllerMiddlewares,
                    "noAutoEnd": defaultNoAutoEnd,
                    "noAutoParams": defaultNoAutoParams,
                    "noAutoQuery": defaultNoAutoQuery,
                    relativePath,
                    server
                }) => {
                    const dir = path.dirname(relativePath);
                    const fileName = path.basename(relativePath, path.extname(relativePath));

                    let routerPath: HttpRequestPath<any> = dir;
                    if (fileName !== "index") {
                        routerPath += `/${fileName}`;
                    }

                    if (controllerRouterPath?.length) {
                        routerPath += normalizeRouterPath(controllerRouterPath);
                    }
                    else {
                        if (controllerMethodName.length && controllerMethodName !== "index") {
                            routerPath += `/${controllerMethodName}`;
                        }
                    }

                    routerPath = normalizeRouterPath(routerPath);
                    routerPath = routerPath.replaceAll("@", ":");

                    if (routerPath.includes(":")) {
                        routerPath = params(routerPath);
                    }

                    const handler = method.bind(controller) as HttpRequestHandler<any, any>;

                    server[httpMethod](routerPath, {
                        "noAutoEnd": defaultNoAutoEnd ?? shouldDoNoAutoEnd,
                        "noAutoParams": defaultNoAutoParams ?? shouldDoNoAutoParams,
                        "noAutoQuery": defaultNoAutoQuery ?? shouldDoNoAutoQuery,
                        "use": [...controllerMiddlewares, ...additionalMiddlewares!]
                    }, handler);
                }
            );
        });
    };
}
