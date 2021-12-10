/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable unicorn/filename-case */

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

import { CONTROLLER_MIDDLEWARES } from '../constants';
import type { HttpMiddleware } from '../types';
import { isClass } from '../utils';

/**
 * Sets up one or more middlewares for all methods of the underlying controller.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, IHttpRequest, IHttpResponse, json, PATCH, POST, schema, Use, validate } from '@egomobile/http-server'
 *
 * const fooSchema = schema.object({
 *   // schema definition for /foo
 * })
 *
 * const barSchema = schema.object({
 *   // schema definition for /bar
 * })
 *
 * @Controller()
 * @Use(json())
 * export default class MyController extends ControllerBase {
 *   @POST({
 *     use: [validate(fooSchema)]  // additional, method specific middleware
 *   })
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     // request.body should now be a plain object
 *     // created from JSON string input
 *     // and validated with fooSchema
 *   }
 *
 *   @PATCH({
 *     use: [validate(barSchema)]
 *   })
 *   async bar(request: IHttpRequest, response: IHttpResponse) {
 *     // request.body should now also be a plain object
 *     // created from JSON string input
 *     // and validated with barSchema
 *   }
 * }
 * ```
 *
 * @param {HttpMiddleware[]} [middlewares] One or more middleware to add.
 *
 * @returns {ClassDecorator} The new decorator function.
 */
export function Use(...middlewares: HttpMiddleware[]): ClassDecorator {
    if (middlewares.some(mw => typeof mw !== 'function')) {
        throw new TypeError('All items of middlewares must be of type function');
    }

    return function (classFunction: Function) {
        if (!isClass(classFunction)) {
            throw new TypeError('classFunction must be of type class');
        }

        const controllerClass: any = classFunction.prototype;

        if (controllerClass[CONTROLLER_MIDDLEWARES]) {
            throw new Error('Cannot redefine list of controller wide middlewares');
        }

        controllerClass[CONTROLLER_MIDDLEWARES] = middlewares;
    };
}
