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
 * ```
 * import { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse, NextFunction, Use } from '@egomobile/http-server'
 *
 * const myGlobalMiddleware1 = async (request: any, response: IHttpResponse, next: NextFunction) => {
 *   request.foo = 1.2  // request.foo === 1.2
 *   next()
 * }
 *
 * const myGlobalMiddleware2 = async (request: any, response: IHttpResponse, next: NextFunction) => {
 *   request.foo += 34  // request.foo === 35.2
 *   next()
 * }
 *
 * @Controller()
 * @Use(myGlobalMiddleware1, myGlobalMiddleware2)
 * export default class MyController extends ControllerBase {
 *   @GET('/foo1', [async (request: any, response: IHttpResponse, next: NextFunction) => {
 *     request.foo += '6'  // request.foo === '35.26'
 *     next()
 *   }])
 *   async foo1(request: any, response: IHttpResponse) {
 *     assert.strictEqual(request.foo, '35.26')
 *   }
 *
 *   @GET('/foo2', [async (request: any, response: IHttpResponse, next: NextFunction) => {
 *     request.foo += '78'  // request.foo === '35.278'
 *     next()
 *   }])
 *   async foo2(request: any, response: IHttpResponse) {
 *     assert.strictEqual(request.foo, '35.278')
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
