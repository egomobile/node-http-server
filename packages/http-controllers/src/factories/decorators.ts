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
import { isSchema, Schema } from "joi";
import path from "node:path";
import { INIT_METHOD_ACTIONS } from "../constants/internal.js";
import { HttpMethodDecoratorArg1, HttpMethodDecoratorArg2, HttpMethodDecoratorArg3, HttpMethodDecoratorWithBodyArg1, HttpMethodDecoratorWithBodyArg2, HttpMethodDecoratorWithBodyArg3, HttpMethodDecoratorWithBodyInputFormat, IHttpMethodDecoratorWithBodyOptions } from "../decorators/index.js";
import { buffer, json, text, validate, yaml } from "../middlewares/index.js";
import type { Nilable } from "../types/internal.js";
import { getMethodOrThrow } from "../utils/decorators.js";
import { getListFromObject, isNil, normalizeRouterPath } from "../utils/internal.js";

interface ICreateHttpMethodDecoratorOptions {
    arg1: Nilable<HttpMethodDecoratorArg1 | HttpMethodDecoratorWithBodyArg1>;
    arg2: Nilable<HttpMethodDecoratorArg2 | HttpMethodDecoratorWithBodyArg2>;
    arg3?: Nilable<HttpMethodDecoratorArg3 | HttpMethodDecoratorWithBodyArg3>;
    httpMethod: HttpMethod;
}

export type InitMethodAction = (context: IInitMethodContext) => Promise<void>;

export interface IInitMethodContext {
    fullPath: string;
    relativePath: string;
    server: IHttpServer<any, any>;
}

const httpMethodsSupportingSchema: HttpMethod[] = ["patch", "post", "put"];

export function createHttpMethodDecorator({
    arg1,
    arg2,
    httpMethod
}: ICreateHttpMethodDecoratorOptions): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
        const method = getMethodOrThrow(descriptor);

        const controllerMethodName = String(propertyKey).trim();

        let controllerRouterPath: Nilable<string>;
        let bodyFormat: Nilable<HttpMethodDecoratorWithBodyInputFormat>;
        let schema: Nilable<Schema>;
        let use: Nilable<HttpMiddleware<any, any>[]>;
        if (!isNil(arg1)) {
            if (typeof arg1 === "string") {
                // arg1: string
                // arg2: Nilable<HttpMiddleware<any, any>[]>

                controllerRouterPath = arg1;
                use = arg2 as Nilable<HttpMiddleware<any, any>[]>;
            }
            else if (Array.isArray(arg1)) {
                // arg1: Nilable<HttpMiddleware<any, any>[]>

                use = arg1 as Nilable<HttpMiddleware<any, any>[]>;
            }
            else if (isSchema(arg1)) {
                schema = arg1;
            }
            else if (typeof arg1 === "object") {
                // arg1: IHttpMethodDecoratorOptions | IHttpMethodDecoratorWithBodyOptions

                bodyFormat = (arg1 as IHttpMethodDecoratorWithBodyOptions).bodyFormat;
                controllerRouterPath = arg1.path;
                use = arg1.use;
            }
        }

        if (!isNil(controllerRouterPath)) {
            if (typeof controllerRouterPath !== "string") {
                throw new TypeError("path must be of type string");
            }
        }

        if (!isNil(use)) {
            if (!Array.isArray(use)) {
                throw new TypeError("use must be of type array");
            }
        }

        // create non-nil copy
        use = [...(use ?? [])];

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

                use.push(
                    parserMiddleware,
                    validate(schema)
                );
            }
        }

        getListFromObject<InitMethodAction>(method, INIT_METHOD_ACTIONS).push(
            async ({ server, relativePath }) => {
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

                server[httpMethod](routerPath, {
                    use
                }, method as HttpRequestHandler<any, any>);
            }
        );
    };
}
