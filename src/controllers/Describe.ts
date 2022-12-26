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
import { isClass, isNil } from "../utils";

/**
 * Possible value for first argument of
 * `@Describe()` decorator.
 */
export type DescribeArgument1 =
    string |
    IDescribeOptions;

/**
 * Possible value for 2nd argument of
 * `@Describe()` decorator.
 */
export type DescribeArgument2 =
    IDescribeOptions;

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
 * @param {Nilable<string>} [name] A custom description / name for the controller / class.
 *                                 If not defined, the name of the class will be used.
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
export function Describe(): ClassDecorator;
export function Describe(name: string, options?: Nilable<IDescribeOptions>): ClassDecorator;
export function Describe(options: IDescribeOptions): ClassDecorator;
export function Describe(arg1?: Nilable<DescribeArgument1>, arg2?: Nilable<DescribeArgument2>): ClassDecorator {
    let name: Nilable<string>;
    let options: Nilable<IDescribeOptions>;

    if (isNil(arg1)) {
        // defaults

        name = arg1 as Nilable<string>;
        options = arg2 as Nilable<IDescribeOptions>;
    }
    else {
        if (typeof arg1 === "string") {
            // [arg1] => name
            // [arg2] => options?

            name = arg1 as string;
            options = arg2 as Nilable<IDescribeOptions>;
        }
        else if (typeof arg1 === "object") {
            // [arg1] => options

            options = arg1 as Nilable<IDescribeOptions>;
        }
        else {
            throw new TypeError("options must be of type object or string");
        }
    }

    if (!isNil(name)) {
        if (typeof name !== "string") {
            throw new TypeError("name must be of type string");
        }
    }

    if (!isNil(options)) {
        if (typeof options !== "object") {
            throw new TypeError("options must be of type object");
        }
    }

    return function (classFunction: Function) {
        if (!isClass(classFunction)) {
            throw new TypeError("classFunction must be of type class");
        }

        const classPrototype: any = classFunction.prototype;

        if (isNil(classPrototype[TEST_DESCRIPTION])) {
            const description: ITestDescription = {
                "name": name || classFunction.name,
                "sortOrder": options?.sortOrder,
                "tag": options?.tag
            };

            classPrototype[TEST_DESCRIPTION] = description;
        }
        else {
            throw new Error(`Can use Describe decorator in ${classFunction.name} only once`);
        }
    };
}
