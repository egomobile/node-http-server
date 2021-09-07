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

import { RESPONSE_SERIALIZER, SETUP_RESPONSE_SERIALIZER } from '../constants';
import type { InitControllerSerializerAction } from '../types/internal';
import { getListFromObject, getMethodOrThrow } from './utils';

/**
 * Add a method of a controller as a response serializer.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse, Serializer } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class MyController extends ControllerBase {
 *   @GET()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     // this will be serialized and send
 *     // by 'serializeResponse()' method (s. below)
 *     return {
 *        success: true,
 *        data: 'foo'
 *     }
 *   }
 *
 *   @Serializer()  // mark that method as default serializer
 *                  // inside that controller
 *   async serializeResponse(result: any, request: IHttpRequest, response: IHttpResponse) {
 *     const jsonResponse = Buffer.from(JSON.stringify(result), 'utf8')
 *
 *     response.writeHead(200, {
 *       'Content-Length': String(jsonResponse.length),
 *       'Content-Type': 'application/json; charset=utf-8'
 *     });
 *     response.write(jsonResponse)
 *   }
 * }
 * ```
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function Serializer(): MethodDecorator {
    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitControllerSerializerAction>(method, SETUP_RESPONSE_SERIALIZER).push(
            ({ controller }) => {
                if ((controller as any)[RESPONSE_SERIALIZER]) {
                    throw new Error(`Cannot redefine ${String(methodName)} method as controllers serializer`);
                }

                (controller as any)[RESPONSE_SERIALIZER] = method;
            }
        );
    };
}
