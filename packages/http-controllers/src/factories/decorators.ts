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

import type { HttpMethod, HttpRequestPath, IHttpServer } from "@egomobile/http-server";
import path from "node:path";
import { INIT_METHOD_ACTIONS } from "../constants/internal.js";
import { Nilable } from "../types/internal.js";
import { getMethodOrThrow } from "../utils/decorators.js";
import { getListFromObject, normalizeRouterPath } from "../utils/internal.js";

interface ICreateHttpMethodDecoratorOptions {
    controllerRouterPath?: Nilable<string>;
    httpMethod: HttpMethod;
}

export type InitMethodAction = (context: IInitMethodContext) => Promise<void>;

export interface IInitMethodContext {
    fullPath: string;
    relativePath: string;
    server: IHttpServer<any, any>;
}

export function createHttpMethodDecorator({
    controllerRouterPath,
    httpMethod
}: ICreateHttpMethodDecoratorOptions): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
        const method = getMethodOrThrow(descriptor);

        const controllerMethodName = String(propertyKey).trim();

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
            }
        );
    };
}
