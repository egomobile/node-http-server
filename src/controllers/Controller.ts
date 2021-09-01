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

import { IS_CONTROLLER_CLASS } from '../constants';
import { isClass } from '../utils';

/**
 * Marks a class as controller.
 *
 * @example
 * ```
 * import { Controller, IHttpRequest, IHttpResponse } from '../src';
 * import { ControllerBase, GET } from '../src/controllers';
 *
 * @Controller()  // all default class exports have to be
 *                // marked with that decorator
 *                // to use them as controllers
 * export default class MyController extends ControllerBase {
 *   @GET()
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     response.write('foo: ' + new Date())
 *   }
 * }
 * ```
 *
 * @returns {ClassDecorator} The class decorator.
 */
export function Controller(): ClassDecorator {
    return function (classFunction: Function) {
        if (!isClass(classFunction)) {
            throw new TypeError('classFunction must be of type class');
        }

        (classFunction.prototype as any)[IS_CONTROLLER_CLASS] = true;
    };
}
