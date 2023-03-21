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
import { CONTROLLER_MIDDLEWARES } from "../constants/internal.js";
import type { ClassDecorator5 } from "../types/internal.js";
import { getListFromObject } from "../utils/internal.js";

/**
 * Returns a decorator, that stores global middlewares
 * for all handlers of a controller class.
 *
 * @example
 * ```
 * import assert from "assert";
 * import { Controller, GET, Use } from "@egomobile/http-controllers";
 *
 * const middleware1 = async (request: any, response: any, next: any) => {
 *     request.foo = "1";
 *
 *     next();
 * };
 *
 * const middleware2 = async (request: any, response: any, next: any) => {
 *     request.foo += "2";
 *
 *     next();
 * };
 *
 * @Controller()
 * @Use(middleware1)  // available in all endpoints
 * export default class MyController {
 *     @GET('/bar')
 *     public async getSomething(request: any, response: any) {
 *         assert.strictEqual(request.foo, "1");
 *     }
 *
 *     @GET('/bazz', [middleware2])  // only available in this endpoint
 *     public async getSomethingElse(request: any, response: any) {
 *         assert.strictEqual(request.foo, "12");
 *     }
 * }
 * ```
 *
 * @param {HttpMiddleware<any, any>[]} [middlewares] One or more middleware to setup.
 *
 * @returns {ClassDecorator5} The new decorator.
 */
export function Use(...middlewares: HttpMiddleware<any, any>[]): ClassDecorator5 {
    if (middlewares.some((mw) => {
        return typeof mw !== "function";
    })) {
        throw new TypeError("All items of middlewares must be of type function");
    }

    return function (target: any, context: ClassDecoratorContext) {
        context.addInitializer(function () {
            const classFunction = this as any;

            getListFromObject<HttpMiddleware<any, any>>(classFunction, CONTROLLER_MIDDLEWARES).push(
                ...middlewares
            );
        });
    };
}
