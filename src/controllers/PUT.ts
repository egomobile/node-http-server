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

import type { ControllerRouteWithBodyOptions, Nilable } from '../types';
import { createHttpMethodDecorator } from './utils';

/**
 * Add a controller method to handle a PUT request.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, IHttpRequest, IHttpResponse } from '../src';
 * import { ControllerBase, PUT } from '../src/controllers';
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   // can by accessed with a PUT request
 *   // by using route /
 *   @PUT()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('(root): ' + new Date())
 *   }
 *
 *   // can by accessed with a PUT request
 *   // by using route /foo
 *   @PUT()
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('foo: ' + new Date())
 *   }
 * }
 * ```
 *
 * @param {Nilable<ControllerRouteOptionsValue>} [options] Custom options.
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function PUT(options?: Nilable<ControllerRouteWithBodyOptions>): MethodDecorator {
    return createHttpMethodDecorator({
        decoratorOptions: options,
        name: 'put'
    });
}
