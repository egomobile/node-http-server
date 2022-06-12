/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { CONTROLLER_METHOD_PARAMETERS } from "../constants";
import { ParameterOptions } from "../types";
import type { IControllerMethodParameter, Nilable } from "../types/internal";
import { isNil } from "../utils";
import { getListFromObject } from "./utils";

/**
 * Imports a request value into an argument / parameter of a handler.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse, Parameter } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   @GET('/foo/:bar/buzz')
 *   async getBar(
 *     request: IHttpRequest, response: IHttpResponse,
 *     @Parameter() bar: string
 *   ) {
 *     response.write('bar: ' + bar)
 *   }
 * }
 * ```
 *
 * @param {Nilable<ParameterOptions>} [options] Custom and additional options.
 *
 * @returns {ParameterDecorator} The new decorator function.
 */
export function Parameter(options?: Nilable<ParameterOptions>): ParameterDecorator {
    if (isNil(options)) {
        options = {};
    }

    if (typeof options !== "object") {
        throw new TypeError("options must be of type object");
    }

    if (!isNil(options.name)) {
        if (typeof options.name !== "string") {
            throw new TypeError("options.name must be of type string");
        }
    }

    return function (target, propertyKey, parameterIndex) {
        const method: Function = (target as any)[propertyKey];

        let parameterName = options!.name;
        if (!parameterName?.trim().length) {
            parameterName = getParamNames(method)[parameterIndex];
        }

        if (!parameterName?.trim().length) {
            throw new Error(`Could not get name for parameter ${parameterIndex} of method ${method.name}`);
        }

        getListFromObject<IControllerMethodParameter>(method, CONTROLLER_METHOD_PARAMETERS).push(
            {
                "index": parameterIndex,
                "name": parameterName,
                method,
                "options": options!
            }
        );
    };
}

// s. https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
function getParamNames(func: Function) {
    let result: Nilable<any[]>;

    try {
        const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        const ARGUMENT_NAMES = /([^\s,]+)/g;

        const fnStr = func.toString().replace(STRIP_COMMENTS, "");
        result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
    }
    catch {
        result = undefined;
    }

    return result ?? [];
}
