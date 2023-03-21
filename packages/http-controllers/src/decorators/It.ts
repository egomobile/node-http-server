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

import { TEST_ACTIONS } from "../constants/internal.js";
import type { ClassMethodDecorator5, ITestAction, Nilable, TestRefValue } from "../types/internal.js";
import { getMethodOrThrow } from "../utils/decorators.js";
import { areRefsEqual, getListFromObject } from "../utils/internal.js";

/**
 * Creates a decorator, that sets up a test for a request method.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, Describe, GET, IHttp1Request, IHttp1Response, It } from '@egomobile/http-server'
 *
 * @Controller()
 * @Describe('My controller')
 * export default class MyController extends ControllerBase {
 *   @GET()
 *   @It('should run without error')
 *   async index(request: IHttp1Request, response: IHttp1Response) {
 *     // your code
 *   }
 * }
 * ```
 *
 * @param {string} description The description of the test.
 *
 * @returns {ClassMethodDecorator5} The new decorator.
 */
export function It(description: string): ClassMethodDecorator5;
export function It(description: string, ref: Nilable<TestRefValue>): ClassMethodDecorator5;
export function It(description: string, ref?: Nilable<TestRefValue>): ClassMethodDecorator5 {
    if (typeof description !== "string") {
        throw new TypeError("description must be of type string");
    }

    return function (target: any, context: ClassMethodDecoratorContext) {
        const method = getMethodOrThrow({
            "value": target
        });

        const actionDescription = description.trim();
        const actionRef: TestRefValue = ref ?? context.name;

        let testAction = getListFromObject<ITestAction>(method, TEST_ACTIONS, {
            "deleteKey": false,
            "noInit": true
        }).find(
            (a) => {
                return areRefsEqual(a.ref, actionRef);
            }
        );

        if (testAction) {
            // no duplicates
            throw new Error(`test action with reference ${String(actionRef)} already exists`);
        }

        testAction = {
            "description": actionDescription,
            "name": method.name,
            "ref": actionRef,
            "script": null  // TODO: make customizable later
        };

        getListFromObject<ITestAction>(method, TEST_ACTIONS).push(
            testAction
        );
    };
}
