/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

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

import type { HttpMiddleware } from "@egomobile/http-server";
import type { AnySchema } from "joi";
import { createHttpMethodDecorator } from "../factories/decorators.js";
import type { Schema } from "../types/index.js";
import type { ClassMethodDecorator5, Nilable } from "../types/internal.js";
import type { HttpMethodDecoratorRoutePath, HttpMethodDecoratorWithBodyArg1, HttpMethodDecoratorWithBodyArg2, HttpMethodDecoratorWithBodyArg3, IHttpMethodDecoratorOptions } from "./index.js";

/**
 * Returns a decorator, that sets up an endpoint for a PUT request.
 *
 * @example
 * ```
 * import { Controller, PUT, IHttp1Request, IHttp1Response } from "@egomobile/http-controllers";
 *
 * @Controller()
 * export default class MyController {
 *     @PUT('/')
 *     public async putSomething(request: IHttp1Request, response: IHttp1Response) {
 *         // ...
 *     }
 * }
 * ```
 *
 * @returns {MethodDecorator} The new decorator.
 */
export function PUT(): ClassMethodDecorator5;
export function PUT(schema: AnySchema): ClassMethodDecorator5;
export function PUT(options: IHttpMethodDecoratorOptions): ClassMethodDecorator5;
export function PUT(use: HttpMiddleware<any, any>[]): ClassMethodDecorator5;
export function PUT(path: HttpMethodDecoratorRoutePath): ClassMethodDecorator5;
export function PUT(path: HttpMethodDecoratorRoutePath, use: HttpMiddleware<any, any>[]): ClassMethodDecorator5;
export function PUT(path: HttpMethodDecoratorRoutePath, schema: Schema): ClassMethodDecorator5;
export function PUT(
    arg1?: Nilable<HttpMethodDecoratorWithBodyArg1>,
    arg2?: Nilable<HttpMethodDecoratorWithBodyArg2>,
    arg3?: Nilable<HttpMethodDecoratorWithBodyArg3>
): ClassMethodDecorator5 {
    return createHttpMethodDecorator({
        arg1,
        arg2,
        arg3,
        "httpMethod": "put"
    });
}
