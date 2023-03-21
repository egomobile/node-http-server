/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

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

import type { HttpMiddleware } from "@egomobile/http-server";
import { createHttpMethodDecorator } from "../factories/decorators.js";
import type { ClassMethodDecorator5, Nilable } from "../types/internal.js";
import type { HttpMethodDecoratorArg1, HttpMethodDecoratorArg2, HttpMethodDecoratorRoutePath, IHttpMethodDecoratorOptions } from "./index.js";

/**
 * Returns a decorator, that sets up an endpoint for a CONNECT request.
 *
 * @example
 * ```
 * import { Controller, CONNECT, IHttp1Request, IHttp1Response } from "@egomobile/http-controllers";
 *
 * @Controller()
 * export default class MyController {
 *     @CONNECT('/')
 *     public async connectSomething(request: IHttp1Request, response: IHttp1Response) {
 *         // ...
 *     }
 * }
 * ```
 *
 * @param {IHttpMethodDecoratorOptions} [options] Custom options.
 * @param {HttpMethodDecoratorRoutePath} [path] The custom path.
 * @param {HttpMiddleware<any, any>[]} [use] Additional middlewares to use.
 *
 * @returns {ClassMethodDecorator5} The new decorator.
 */
export function CONNECT(): ClassMethodDecorator5;
export function CONNECT(options: IHttpMethodDecoratorOptions): ClassMethodDecorator5;
export function CONNECT(use: HttpMiddleware<any, any>[]): ClassMethodDecorator5;
export function CONNECT(path: HttpMethodDecoratorRoutePath, use?: Nilable<HttpMiddleware<any, any>[]>): ClassMethodDecorator5;
export function CONNECT(arg1?: Nilable<HttpMethodDecoratorArg1>, arg2?: Nilable<HttpMethodDecoratorArg2>): ClassMethodDecorator5 {
    return createHttpMethodDecorator({
        arg1,
        arg2,
        "httpMethod": "connect"
    });
}
