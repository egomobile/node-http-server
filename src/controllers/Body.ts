/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { CONTROLLER_METHOD_PARAMETERS } from "../constants";
import { ParameterDataTransformTo } from "../types";
import type { IControllerMethodParameter } from "../types/internal";
import { getFunctionParamNames } from "../utils";
import { getListFromObject } from "./utils";

/**
 * Imports one or more query parameters from URL into an argument / parameter of a handler
 * as key/value pair.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Body, Controller, ControllerBase, IHttpRequest, IHttpResponse, POST, Request, Response, text, Use } from '@egomobile/http-server'
 *
 * @Controller()
 * @Use(text())
 * export default class IndexController extends ControllerBase {
 *   @POST('/foo')
 *   async postFoo(
 *     @Body(({ source }) => JSON.parse(source)) importedBody: any,
 *
 *     @Response() response: IHttpResponse
 *   ) {
 *     response.write(`body: ${JSON.stringify(importedBody)}`)
 *   }
 * }
 * ```
 *
 * @param {ParameterDataTransformTo} [transformTo] The custom and optional data transformer.
 *
 * @returns {ParameterDecorator} The new decorator function.
 */
export function Body(transformTo?: ParameterDataTransformTo): ParameterDecorator {
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
                    "source": "body",
                    transformTo
                }
            }
        );
    };
}
