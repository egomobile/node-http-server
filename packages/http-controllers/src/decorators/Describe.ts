/* eslint-disable @typescript-eslint/naming-convention */

// This file is part of the @egomobile/http-controllers distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-controllers is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-controllers is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { TEST_DESCRIPTIONS } from "../constants/internal.js";
import type { ClassDecorator5, ITestDescription, Nilable } from "../types/internal.js";
import { getListFromObject, isNil } from "../utils/internal.js";

/**
 * Creates a decorator, that marks a class, so it can be used for tests.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, Describe, GET, IHttp1Request, IHttp1Response, It } from '@egomobile/http-server'
 *
 * @Controller()
 * @Describe()  // name is `MyController` by default
 * export default class MyController extends ControllerBase {
 *   @GET()
 *   @It('should run without error')
 *   async index(request: IHttp1Request, response: IHttp1Response) {
 *     // your code
 *   }
 * }
 * ```
 *
 * @param {Nilable<string>} [name] The custom name / category. Default: Class name.
 *
 * @returns {ClassDecorator5} The new decorator.
 */
export function Describe(): ClassDecorator5;
export function Describe(name: Nilable<string>): ClassDecorator5;
export function Describe(name?: Nilable<string>): ClassDecorator5 {
    if (!isNil(name)) {
        if (typeof name !== "string") {
            throw new TypeError("name must be of type string");
        }
    }

    return function (target: Function, context: ClassDecoratorContext) {
        context.addInitializer(function () {
            const classFunction = this as any;

            const descriptionName = name?.trim() || classFunction.name;

            let testDescription = getListFromObject<ITestDescription>(classFunction, TEST_DESCRIPTIONS, {
                "deleteKey": false,
                "noInit": true
            }).find(
                (d) => {
                    return d.name === descriptionName;
                }
            );

            if (testDescription) {
                // no duplicates
                throw new Error(`test description with name ${String(descriptionName)} already exists`);
            }

            testDescription = {
                "name": name?.trim() || classFunction.name,
                "script": null  // TODO: make customizable later
            };

            getListFromObject<ITestDescription>(classFunction, TEST_DESCRIPTIONS).push(
                testDescription
            );
        });
    };
}
