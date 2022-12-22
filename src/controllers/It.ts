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

import type { ITestSettings } from "..";
import { ADD_CONTROLLER_METHOD_TEST_ACTION, TEST_OPTIONS } from "../constants";
import type { InitControllerMethodTestAction, ITestOptions, Nilable } from "../types/internal";
import { isNil } from "../utils";
import { getListFromObject, getMethodOrThrow } from "./utils";

/**
 * Sets up a request method for use in (unit-)tests.
 *
 * @param {string} name A description / name for the controller / class.
 * @param {Nilable<ITestSettings>} [settings] Custom settings.
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
 * @returns {MethodDecorator} The method decorator.
 */
export function It(name: string, settings?: Nilable<ITestSettings>): MethodDecorator {
    if (typeof name !== "string") {
        throw new TypeError("name must be of type string");
    }

    if (!isNil(settings)) {
        if (typeof settings !== "object") {
            throw new TypeError("settings must be of type object");
        }
    }

    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitControllerMethodTestAction>(method, ADD_CONTROLLER_METHOD_TEST_ACTION).push(
            ({ controller, server }) => {
                const options: ITestOptions = {
                    controller,
                    method,
                    methodName,
                    name,
                    "settings": settings || {}
                };

                getListFromObject<ITestOptions>(server, TEST_OPTIONS).push(
                    options
                );
            }
        );
    };
}
