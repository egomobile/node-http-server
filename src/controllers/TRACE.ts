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

import type { ControllerRouteArgument1, ControllerRouteArgument2, ControllerRoutePath, HttpMiddleware, IControllerRouteOptions, IControllerRouteWithBodyOptions } from '../types';
import type { Nilable } from '../types/internal';
import { createHttpMethodDecorator } from './factories';

/**
 * Add a controller method to handle a TRACE request.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, IHttpRequest, IHttpResponse, TRACE } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   // can be accessed with a TRACE request
 *   // by using route /
 *   @TRACE()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('(root): ' + new Date())
 *   }
 *
 *   // can be accessed with a TRACE request
 *   // by using route /foo
 *   @TRACE()
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('foo: ' + new Date())
 *   }
 *
 *   // can be accessed with a TRACE request
 *   // by using route /baz
 *   @TRACE('/baz')
 *   async bar(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('baz: ' + new Date())
 *   }
 * }
 * ```
 *
 * @param {Nilable<IControllerRouteOptions>} [options] Custom options.
 * @param {Nilable<ControllerRoutePath>} [path] The custom path.
 * @param {Nilable<HttpMiddleware[]>} [use] Additional middlewares.
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function TRACE(): MethodDecorator;
export function TRACE(options: IControllerRouteOptions): MethodDecorator;
export function TRACE(use: HttpMiddleware[]): MethodDecorator;
export function TRACE(path: ControllerRoutePath, use?: Nilable<HttpMiddleware[]>): MethodDecorator;
export function TRACE(arg1?: Nilable<ControllerRouteArgument1>, arg2?: Nilable<ControllerRouteArgument2>): MethodDecorator {
    return createHttpMethodDecorator({
        decoratorOptions: {
            arg1: arg1 as Nilable<ControllerRouteArgument1<IControllerRouteWithBodyOptions>>,
            arg2: arg2 as Nilable<ControllerRouteArgument2>,
            arg3: undefined
        },
        name: 'trace'
    });
}
