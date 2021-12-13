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

import { DOCUMENTATION_UPDATER, SETUP_DOCUMENTATION_UPDATER } from '../constants';
import type { InitDocumentationUpdaterAction } from '../types/internal';
import { getListFromObject, getMethodOrThrow } from './utils';

/**
 * Add a method of a controller as a response serializer.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, DocumentationUpdater, GET, IDocumentationUpdaterContext, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class MyController extends ControllerBase {
 *   @GET({
 *     documentation: {
 *       responses: {
 *         '200': {
 *           description: 'foo response data'
 *         }
 *       }
 *     }
 *   })
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('foo!')
 *   }
 *
 *   @DocumentationUpdater()  // mark that method to update swagger documentations
 *                            // of a route
 *   updateDocumentation({ documentation }: IDocumentationUpdaterContext) {
 *     // keep sure, that any documentation object has a response
 *     // with a 500 entry
 *     if (!documentation.responses['500']) {
 *       documentation.responses['500'] = {
 *         description: 'An error occurred!'
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function DocumentationUpdater(): MethodDecorator {
    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitDocumentationUpdaterAction>(method, SETUP_DOCUMENTATION_UPDATER).push(
            ({ controller }) => {
                (controller as any)[DOCUMENTATION_UPDATER] = method.bind(controller);
            }
        );
    };
}
