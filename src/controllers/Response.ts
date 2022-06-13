/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { CONTROLLER_METHOD_PARAMETERS } from "../constants";
import type { IControllerMethodParameter } from "../types/internal";
import { getFunctionParamNames } from "../utils";
import { getListFromObject } from "./utils";

/**
 * Imports the response context into an argument / parameter of a handler.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse, Parameter, Request, Response } from '@egomobile/http-server'
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   @GET('/foo/:bar/buzz')
 *   async getBar(
 *     @Parameter() bar: string,
 *     @Request() request: IHttpRequest, @Response() response: IHttpResponse
 *   ) {
 *     response.write('bar: ' + bar)
 *   }
 * }
 * ```
 *
 * @returns {ParameterDecorator} The new decorator function.
 */
export function Response(): ParameterDecorator {
    return function (target, propertyKey, parameterIndex) {
        const method: Function = (target as any)[propertyKey];

        const parameterName = getFunctionParamNames(method)[parameterIndex];
        if (!parameterName?.trim().length) {
            throw new Error(`Could not get name for parameter ${parameterIndex} of method ${method.name}`);
        }

        getListFromObject<IControllerMethodParameter>(method, CONTROLLER_METHOD_PARAMETERS).push(
            {
                "index": parameterIndex,
                "name": parameterName,
                method,
                "options": {
                    "source": "response"
                }
            }
        );
    };
}
