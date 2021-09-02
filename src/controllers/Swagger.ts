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

import { OpenAPIV3 } from 'openapi-types';
import { HTTP_METHODS, INIT_SERVER_CONTROLLER_ACTIONS, ROUTER_PATHS, SWAGGER_METHOD_INFO } from '../constants';
import { toSwaggerPath } from '../swagger/utils';
import { HttpMethod, Nilable } from '../types';
import type { InitControllerMethodSwaggerAction, ISwaggerMethodInfo } from '../types/internal';
import { sortObjectByKeys } from '../utils';
import { getActionList, getMethodOrThrow } from './utils';

/**
 * Add a method of a controller as a response serializer.
 *
 * @see https://swagger.io/docs/specification/paths-and-operations/
 *
 * @example
 * ```
 * import { Controller, ControllerBase, IHttpRequest, IHttpResponse, POST, Serializer, Swagger } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class MyController extends ControllerBase {
 *   @POST()
 *   @Swagger({
 *     summary: 'The is a small description for the endpoint.',
 *     description: 'This is a **LONG** description for that awesome endpoint with _Markdown_ support.',
 *     requestBody: {
 *       description: 'The data for the request.',
 *       required: true,
 *       content: {
 *         'application/json': {
 *           schema: {
 *             $ref: '#/components/schemas/MyControllerRequestBody'
 *           }
 *         }
 *       }
 *     },
 *     responses: {
 *       '204': {
 *         description: 'Operation was successful.'
 *       }
 *     }
 *   })
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     // TODO
 *   }
 * }
 * ```
 *
 * @param {OpenAPIV3.OperationObject} doc The documentation for the path.
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function Swagger(doc: OpenAPIV3.OperationObject): MethodDecorator {
    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getActionList<InitControllerMethodSwaggerAction>(method, INIT_SERVER_CONTROLLER_ACTIONS).push(
            ({ apiDocument }) => {
                if ((method as any)[SWAGGER_METHOD_INFO]) {
                    throw new Error(`Cannot redefine Swagger definition of ${String(methodName)}`);
                }

                const info: ISwaggerMethodInfo = {
                    doc,
                    method
                };

                (method as any)[SWAGGER_METHOD_INFO] = info;

                const routerPaths: Nilable<string[]> = (method as any)[ROUTER_PATHS];
                if (routerPaths?.length) {
                    const httpMethods: Nilable<HttpMethod[]> = (method as any)[HTTP_METHODS];

                    let paths = apiDocument.paths!;

                    if (httpMethods?.length) {
                        routerPaths.forEach(routerPath => {
                            const swaggerPath = toSwaggerPath(routerPath);

                            httpMethods!.forEach(httpMethod => {
                                let pathObj: any = paths[swaggerPath];
                                if (!pathObj) {
                                    pathObj = {};
                                }

                                let methodObj: any = pathObj[httpMethod];
                                if (methodObj) {
                                    throw new Error(`Cannot reset documentation for route ${routerPath} (${httpMethod.toUpperCase()})`);
                                }

                                pathObj[httpMethod] = doc;

                                paths[swaggerPath] = sortObjectByKeys(pathObj);
                            });
                        });
                    }

                    apiDocument.paths = sortObjectByKeys(paths);
                }
            }
        );
    };
}
