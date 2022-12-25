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

import { TEST_DESCRIPTION } from "../constants";
import type { ITestDescription, Nilable } from "../types/internal";
import { isClass } from "../utils";

/**
 * Custom options for `@Describe()` decorator.
 */
export interface IDescribeOptions {
    /**
     * Something, that should be shared with the group.
     */
    tag?: any;
    /**
     * A sort order inside the groups.
     */
    sortOrder?: any;
}

/**
 * Marks a (controller) class to use in an environment with (unit-)tests, e.g.
 *
 * @param {string} name A description / name for the controller / class.
 * @param {Nilable<IDescribeOptions>} [options] Custom options.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, Describe, GET, IHttpRequest, IHttpResponse, It } from '@egomobile/http-server'
 *
 * @Controller()
 * @Describe('My controller')
 * export default class MyController extends ControllerBase {
 *   @GET()
 *   @It('should run without error')
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     // your code
 *   }
 * }
 * ```
 *
 * @returns {ClassDecorator} The class decorator.
 */
export function Describe(name: string, options?: Nilable<IDescribeOptions>): ClassDecorator {
    if (typeof name !== "string") {
        throw new TypeError("name must be of type string");
    }

    return function (classFunction: Function) {
        if (!isClass(classFunction)) {
            throw new TypeError("classFunction must be of type class");
        }

        const description: ITestDescription = {
            name,
            "sortOrder": options?.sortOrder,
            "tag": options?.tag
        };

        (classFunction.prototype as any)[TEST_DESCRIPTION] = description;
    };
}
