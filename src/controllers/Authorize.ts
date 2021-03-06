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

import { INIT_CONTROLLER_AUTHORIZE } from "../constants";
import type { AuthorizeArgumentValue, AuthorizeOptionArgument1, AuthorizeRoles, AuthorizeValidationFailedHandler, AuthorizeValidatorValue, IAuthorizeOptions } from "../types";
import type { InitControllerAuthorizeAction, Nilable } from "../types/internal";
import { isClass, isNil } from "../utils";
import { createAuthorizeValidatorFromExpression, createInitControllerAuthorizeAction, getListFromObject } from "./utils";

/**
 * Marks a class as controller.
 *
 * @example
 * ```
 * import { Authorize, Controller, ControllerBase, GET, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * @Controller()
 * @Authorize(['user'])  // requires 'user' role
 * export default class IndexController extends ControllerBase {
 *   // use global authorize
 *   @GET()
 *   async foo(request: IHttpRequest, response: IHttpResponse) {
 *     // you can access request.authorizedUser with authorized user
 *   }
 *
 *   @GET({
 *     // define custom validator as filter expression
 *     //
 *     // s. https://github.com/m93a/filtrex
 *     // for more information
 *     authorize: 'hasRole("admin") and hasHeader("x-my-header", "my-header-value")',
 *   })
 *   async bar(request: IHttpRequest, response: IHttpResponse) {
 *     // you can access request.authorizedUser with authorized user
 *   }
 * }
 *
 * // ...
 * // your initlaizer script
 *
 * // ...
 *
 * app.controllers({
 *   authorize: {
 *     // try find data for an existing user
 *     findAuthorizedUser: async (context) => {
 *       // if there is no matching user, return
 *       // a falsy value, like (null) or (undefined)
 *
 *       return {
 *         roles: roles  // an array of roles
 *       }
 *     }
 *   }
 * })
 *
 * /// ...
 * ```
 *
 * @param {IAuthorizeOptions} options The options.
 * @param {AuthorizeValidatorValue} validator The validator.
 * @param {AuthorizeRoles} roles The list of valid roles.
 * @param {Nilable<AuthorizeValidationFailedHandler>} [onValidationFailed] The custom handler, if a validation fails.
 *
 * @returns {ClassDecorator} The decorator.
 */
export function Authorize(): ClassDecorator;
export function Authorize(validator: AuthorizeValidatorValue, onValidationFailed?: Nilable<AuthorizeValidationFailedHandler>): ClassDecorator;
export function Authorize(options: IAuthorizeOptions): ClassDecorator;
export function Authorize(roles: AuthorizeRoles, onValidationFailed?: Nilable<AuthorizeValidationFailedHandler>): ClassDecorator;
export function Authorize(
    arg1?: AuthorizeArgumentValue,
    arg2?: Nilable<AuthorizeValidationFailedHandler>
): ClassDecorator {
    let optionArg: AuthorizeOptionArgument1;
    if (Array.isArray(arg1)) {
        // arg1 => roles

        optionArg = {
            "roles": arg1 as AuthorizeRoles,
            "onValidationFailed": arg2 as AuthorizeValidationFailedHandler
        };
    }
    else if (typeof arg1 === "function") {
        // arg1 => validator

        optionArg = {
            "validator": arg1 as AuthorizeValidatorValue,
            "onValidationFailed": arg2 as AuthorizeValidationFailedHandler
        };
    }
    else if (typeof arg1 === "string") {
        // arg1 => validatorExpression

        optionArg = {
            "validator": createAuthorizeValidatorFromExpression(arg1),
            "onValidationFailed": arg2 as AuthorizeValidationFailedHandler
        };
    }
    else if (isNil(arg1)) {
        optionArg = {};
    }
    else {
        optionArg = arg1 as AuthorizeOptionArgument1;
    }

    if (
        typeof optionArg !== "function" &&
        typeof optionArg !== "string" &&
        typeof optionArg !== "object"
    ) {
        throw new TypeError("arg1 must be of type array, object, function or string");
    }

    return function (classFunction: Function) {
        if (!isClass(classFunction)) {
            throw new TypeError("classFunction must be of type class");
        }

        const controllerClass: any = classFunction.prototype;

        getListFromObject<InitControllerAuthorizeAction>(controllerClass, INIT_CONTROLLER_AUTHORIZE).push(
            createInitControllerAuthorizeAction({ "arg": optionArg })
        );
    };
}
