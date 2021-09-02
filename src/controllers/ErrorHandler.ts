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

import { ERROR_HANDLER, SETUP_ERROR_HANDLER } from '../constants';
import type { InitControllerErrorHandlerAction } from '../types/internal';
import { getListFromObject, getMethodOrThrow } from './utils';

/**
 * Add a method of a controller as an error handler.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, ErrorHandler, GET, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class MyController extends ControllerBase {
 *   @GET()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     throw new Error('Something went wrong!')
 *   }
 *
 *   @ErrorHandler()  // mark that method as default error handler
 *                    // inside that controller
 *   async handleError(error: any, request: IHttpRequest, response: IHttpResponse) {
 *     const errorMessage = Buffer.from('ERROR: ' + String(error), 'utf8')
 *
 *     response.writeHead(500, {
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
export function ErrorHandler(): MethodDecorator {
    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitControllerErrorHandlerAction>(method, SETUP_ERROR_HANDLER).push(
            ({ controller }) => {
                if ((controller as any)[ERROR_HANDLER]) {
                    throw new Error(`Cannot redefine ${String(methodName)} method as controllers error handler`);
                }

                (controller as any)[ERROR_HANDLER] = method;
            }
        );
    };
}
