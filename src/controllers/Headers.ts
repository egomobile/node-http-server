/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { CONTROLLER_METHOD_PARAMETERS } from "../constants";
import type { IControllerMethodParameter } from "../types/internal";
import { getFunctionParamNames } from "../utils";
import { getListFromObject } from "./utils";

/**
 * Imports one or more HTTP request header into an argument / parameter of a handler
 * as key/value pair.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, GET, Headers, IHttpRequest, IHttpResponse, Request, Response } from '@egomobile/http-server'
 *
 * interface IHeaders {
 *   "x-ego-1": string;
 *   "x-ego-2": number;
 *   "x-ego-3": boolean;
 * }
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   @GET('/foo/:bar/buzz')
 *   async getBar(
 *     @Headers(({ key, source }) => {
 *       if (key === 'x-ego-2') {
 *         return Number(source)
 *       } else if (key === 'x-ego-3') {
 *         return Boolean(source)
 *       }
 *
 *       return source
 *     }) importedHeaders: IHeaders,
 *
 *     @Response() response: IHttpResponse
 *   ) {
 *     response.write(`x-ego-1: ${importedHeaders['x-ego-1']} (${typeof importedHeaders['x-ego-1']})\n`)
 *     response.write(`x-ego-2: ${importedHeaders['x-ego-2']} (${typeof importedHeaders['x-ego-2']})\n`)
 *     response.write(`x-ego-3: ${importedHeaders['x-ego-3']} (${typeof importedHeaders['x-ego-3']})\n`)
 *   }
 * }
 * ```
 *
 * @param {string[]} [names] One or more headers to import.
 *
 * @returns {ParameterDecorator} The new decorator function.
 */
export function Headers(...names: string[]): ParameterDecorator {
    if (names.some((n) => {
        return typeof n !== "string";
    })) {
        throw new TypeError("All items of names must be of type string");
    }

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
                    names,
                    "source": "headers"
                }
            }
        );
    };
}
