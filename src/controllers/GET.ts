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

import { createHttpMethodDecorator } from './factories';
import type { ControllerRouteArgument1, ControllerRouteArgument2, ControllerRoutePath, HttpMiddleware, IControllerRouteOptions, IControllerRouteWithBodyOptions, Nilable } from '../types';

/**
 * Add a controller method to handle a GET request.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   // can be accessed with a GET request
 *   // by using route /
 *   @GET()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('(root): ' + new Date())
 *   }
 *
 *   // can be accessed with a GET request
 *   // by using route /foo
 *   @GET()
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('foo: ' + new Date())
 *   }
 *
 *   // can be accessed with a GET request
 *   // by using route /baz
 *   @GET('/baz')
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
export function GET(): MethodDecorator;
export function GET(options: IControllerRouteOptions): MethodDecorator;
export function GET(use: HttpMiddleware[]): MethodDecorator;
export function GET(path: ControllerRoutePath, use?: Nilable<HttpMiddleware[]>): MethodDecorator;
export function GET(arg1?: Nilable<ControllerRouteArgument1>, arg2?: Nilable<ControllerRouteArgument2>): MethodDecorator {
    return createHttpMethodDecorator({
        decoratorOptions: {
            arg1: arg1 as Nilable<ControllerRouteArgument1<IControllerRouteWithBodyOptions>>,
            arg2: arg2 as Nilable<ControllerRouteArgument2>,
            arg3: undefined
        },
        name: 'get'
    });
}
