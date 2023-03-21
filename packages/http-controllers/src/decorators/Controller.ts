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

import { IS_CONTROLLER_CLASS } from "../constants/internal.js";
import type { ClassDecorator5 } from "../types/internal.js";

/**
 * Returns a decorator, that marks a class as
 * controller class.
 *
 * @example
 * ```
 * import { Controller, GET, IHttp1Request, IHttp1Response } from "@egomobile/http-controllers";
 *
 * @Controller()
 * export default class MyController {
 *     @GET('/')
 *     public async getSomething(request: IHttp1Request, response: IHttp1Response) {
 *         // ...
 *     }
 * }
 * ```
 *
 * @returns {ClassDecorator5} The new decorator.
 */
export function Controller(): ClassDecorator5 {
    return function (target: any, context: ClassDecoratorContext) {
        context.addInitializer(function () {
            const classFunction = this as any;

            classFunction[IS_CONTROLLER_CLASS] = true;
        });
    };
}
