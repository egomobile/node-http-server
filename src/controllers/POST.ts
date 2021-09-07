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

import type { AnySchema } from 'joi';
import type { ControllerRouteArgument1, ControllerRouteArgument2, ControllerRouteArgument3, ControllerRoutePath, HttpInputDataFormat, HttpMiddleware, IControllerRouteWithBodyOptions, Nilable } from '../types';
import { createHttpMethodDecorator } from './factories';

/**
 * Add a controller method to handle a POST request.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, IHttpRequest, IHttpResponse, POST } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   // can by accessed with a POST request
 *   // by using route /
 *   @POST()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('(root): ' + new Date())
 *   }
 *
 *   // can by accessed with a POST request
 *   // by using route /foo
 *   @POST()
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('foo: ' + new Date())
 *   }
 * }
 * ```
 *
 * @param {Nilable<HttpInputDataFormat>} [format] The custom format of the input.
 * @param {Nilable<number>} [limit] A custom limited, size in MB, for the input data.
 * @param {Nilable<IControllerRouteOptions>} [options] Custom options.
 * @param {Nilable<ControllerRoutePath>} [path] The custom path.
 * @param {Nilable<AnySchema>} [schema] An optional schema, that validates the body.
 * @param {Nilable<HttpMiddleware[]>} [use] Additional middlewares.
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function POST(): MethodDecorator;
export function POST(limit: number, format?: Nilable<HttpInputDataFormat>): MethodDecorator;
export function POST(options: IControllerRouteWithBodyOptions): MethodDecorator;
export function POST(schema: AnySchema, limit?: number): MethodDecorator;
export function POST(use: HttpMiddleware[]): MethodDecorator;
export function POST(path: ControllerRoutePath): MethodDecorator;
export function POST(path: ControllerRoutePath, use: HttpMiddleware[]): MethodDecorator;
export function POST(path: ControllerRoutePath, schema: AnySchema, limit?: number): MethodDecorator;
export function POST(
    arg1?: ControllerRouteArgument1<IControllerRouteWithBodyOptions>,
    arg2?: ControllerRouteArgument2,
    arg3?: ControllerRouteArgument3
): MethodDecorator {
    return createHttpMethodDecorator({
        decoratorOptions: {
            arg1,
            arg2,
            arg3
        },
        name: 'post'
    });
}
