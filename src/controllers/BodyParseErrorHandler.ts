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

import { PARSE_ERROR_HANDLER, SETUP_PARSE_ERROR_HANDLER } from "../constants";
import type { InitControllerParseErrorHandlerAction } from "../types/internal";
import { getListFromObject, getMethodOrThrow } from "./utils";

/**
 * Add a method of a controller as a parse error handler.
 *
 * @example
 * ```
 * import { BodyParseErrorHandler, Controller, ControllerBase, IHttpRequest, IHttpResponse, ParseError, ParseErrorHandler, POST, schema } from '@egomobile/http-server'
 *
 * const mySchema = schema.object({
 *   email: schema.string().trim().email().required(),
 *   name: schema.string().trim().min(1).optional()
 * })
 *
 * @Controller()
 * export default class MyController extends ControllerBase {
 *   @POST(mySchema)
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('You send: ' + JSON.stringify(response.body!))
 *   }
 *
 *   @BodyParseErrorHandler()  // mark that method as default
 *                             // parse error handler inside that controller
 *   async handleBodyParseError(error: ParseError, request: IHttpRequest, response: IHttpResponse) {
 *     const errorMessage = Buffer.from('VALIDATION ERROR: ' + error.message, 'utf8')
 *
 *     response.writeHead(400, {
 *       'Content-Length': String(errorMessage.length)
 *     })
 *     response.write(errorMessage)
 *
 *     response.end()
 *   }
 * }
 * ```
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function BodyParseErrorHandler(): MethodDecorator {
    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitControllerParseErrorHandlerAction>(method, SETUP_PARSE_ERROR_HANDLER).push(
            ({ controller }) => {
                (controller as any)[PARSE_ERROR_HANDLER] = method.bind(controller);
            }
        );
    };
}
