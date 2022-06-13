/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { CONTROLLER_METHOD_PARAMETERS } from "../constants";
import type { ParameterArgument1, ParameterArgument2, ParameterDataTransformer, ParameterDataTransformerTo, ParameterOptions } from "../types";
import type { IControllerMethodParameter, Nilable } from "../types/internal";
import { getFunctionParamNames, isNil } from "../utils";
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
export function Parameter(): ParameterDecorator;
export function Parameter(name: string): ParameterDecorator;
export function Parameter(name: string, transformTo: Nilable<ParameterDataTransformerTo>): ParameterDecorator;
export function Parameter(transformer: ParameterDataTransformer): ParameterDecorator;
export function Parameter(options: ParameterOptions): ParameterDecorator;
export function Parameter(arg1?: Nilable<ParameterArgument1>, arg2?: Nilable<ParameterArgument2>): ParameterDecorator {
    let options: ParameterOptions;

    if (isNil(arg1)) {
        options = {};
    }
    else {
        if (typeof arg1 === "string") {
            // arg1 => name

            options = {
                "name": arg1,
                "transformTo": arg2 as ParameterDataTransformerTo
            };
        }
        else if (typeof arg1 === "function") {
            // arg1 => transformer

            options = {
                "transformTo": arg1 as ParameterDataTransformer
            };
        }
        else {
            options = arg1 as ParameterOptions;
        }
    }

    if (typeof options !== "object") {
        throw new TypeError("arg1 must be of type object, function or string");
    }

    if (!isNil((options as any).name)) {
        if (typeof (options as any).name !== "string") {
            throw new TypeError("options.name must be of type string");
        }
    }

    return function (target, propertyKey, parameterIndex) {
        const method: Function = (target as any)[propertyKey];

        let parameterName = (options as any).name;
        if (!parameterName?.trim().length) {
            parameterName = getFunctionParamNames(method)[parameterIndex];
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
