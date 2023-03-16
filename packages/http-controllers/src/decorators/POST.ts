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
import type { Nilable } from "../types/internal.js";
import type { HttpMethodDecoratorRoutePath, HttpMethodDecoratorWithBodyArg1, HttpMethodDecoratorWithBodyArg2, HttpMethodDecoratorWithBodyArg3, IHttpMethodDecoratorOptions } from "./index.js";

/**
 * Returns a legacy TypeScript decorator, that sets up an endpoint for a POST request.
 *
 * @example
 * ```
 * import { Controller, POST, IHttp1Request, IHttp1Response } from "@egomobile/http-controllers";
 *
 * @Controller()
 * export default class MyController {
 *     @POST('/')
 *     public async postSomething(request: IHttp1Request, response: IHttp1Response) {
 *         // ...
 *     }
 * }
 * ```
 *
 * @param {IHttpMethodDecoratorOptions} [options] The custom options.
 * @param {HttpMethodDecoratorRoutePath} [path] The custom path.
 * @param {AnySchema|Schema} [schema] The schema for the validation.
 * @param {HttpMiddleware<any, any>[]} [use] Additional middlewares to use.
 *
 * @returns {MethodDecorator} The new decorator.
 */
export function POST(): MethodDecorator;
export function POST(schema: AnySchema): MethodDecorator;
export function POST(options: IHttpMethodDecoratorOptions): MethodDecorator;
export function POST(use: HttpMiddleware<any, any>[]): MethodDecorator;
export function POST(path: HttpMethodDecoratorRoutePath): MethodDecorator;
export function POST(path: HttpMethodDecoratorRoutePath, use: HttpMiddleware<any, any>[]): MethodDecorator;
export function POST(path: HttpMethodDecoratorRoutePath, schema: Schema): MethodDecorator;
export function POST(
    arg1?: Nilable<HttpMethodDecoratorWithBodyArg1>,
    arg2?: Nilable<HttpMethodDecoratorWithBodyArg2>,
    arg3?: Nilable<HttpMethodDecoratorWithBodyArg3>
): MethodDecorator {
    return createHttpMethodDecorator({
        arg1,
        arg2,
        arg3,
        "httpMethod": "post"
    });
}