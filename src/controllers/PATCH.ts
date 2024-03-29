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

import type { AnySchema } from "joi";
import type { ControllerRouteArgument1, ControllerRouteArgument2, ControllerRouteArgument3, ControllerRoutePath, ControllerRouteWithBodyOptions, HttpInputDataFormat, HttpMiddleware, IControllerRouteWithBodyAndJoiSchemaOptions, IControllerRouteWithBodyAndJsonSchemaOptions, Schema } from "../types";
import type { Nilable } from "../types/internal";
import { createHttpMethodDecorator } from "./factories";

/**
 * Add a controller method to handle a PATCH request.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, IHttpRequest, IHttpResponse, PATCH } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   // can be accessed with a PATCH request
 *   // by using route /
 *   @PATCH()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('(root): ' + new Date())
 *   }
 *
 *   // can be accessed with a PATCH request
 *   // by using route /foo
 *   @PATCH()
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('foo: ' + new Date())
 *   }
 *
 *   // can be accessed with a PATCH request
 *   // by using route /baz
 *   @PATCH('/baz')
 *   async bar(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('baz: ' + new Date())
 *   }
 * }
 * ```
 *
 * @param {Nilable<HttpInputDataFormat>} [format] The custom format of the input.
 * @param {Nilable<number>} [limit] A custom limited, size in MB, for the input data.
 * @param {Nilable<ControllerRouteWithBodyOptions>} [options] Custom options.
 * @param {Nilable<ControllerRoutePath>} [path] The custom path.
 * @param {Nilable<Schema>} [schema] An optional schema, that validates the body.
 * @param {Nilable<HttpMiddleware[]>} [use] Additional middlewares.
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function PATCH(): MethodDecorator;
export function PATCH(limit: number, format?: Nilable<HttpInputDataFormat>): MethodDecorator;
export function PATCH(schema: AnySchema, limit?: Nilable<number>): MethodDecorator;
export function PATCH(options: IControllerRouteWithBodyAndJsonSchemaOptions): MethodDecorator;
export function PATCH(options: IControllerRouteWithBodyAndJoiSchemaOptions): MethodDecorator;
export function PATCH(options: ControllerRouteWithBodyOptions): MethodDecorator;
export function PATCH(use: HttpMiddleware[]): MethodDecorator;
export function PATCH(path: ControllerRoutePath): MethodDecorator;
export function PATCH(path: ControllerRoutePath, use: HttpMiddleware[]): MethodDecorator;
export function PATCH(path: ControllerRoutePath, schema: Schema, limit?: Nilable<number>): MethodDecorator;
export function PATCH(
    arg1?: Nilable<ControllerRouteArgument1<ControllerRouteWithBodyOptions>>,
    arg2?: Nilable<ControllerRouteArgument2>,
    arg3?: Nilable<ControllerRouteArgument3>
): MethodDecorator {
    return createHttpMethodDecorator({
        "decoratorOptions": {
            arg1,
            arg2,
            arg3
        },
        "name": "patch"
    });
}
