/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { CONTROLLER_METHOD_PARAMETERS } from "../constants";
import { ParameterDataTransformer } from "../types";
import type { IControllerMethodParameter, Nilable } from "../types/internal";
import { getFunctionParamNames, isNil } from "../utils";
import { getListFromObject } from "./utils";

/**
 * Imports one or more query parameters from URL into an argument / parameter of a handler
 * as key/value pair.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse, Query, Request, Response } from '@egomobile/http-server'
 *
 * interface IQuery {
 *   "xEgo1": string;
 *   "xEgo2": number;
 *   "xEgo3": boolean;
 * }
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   @GET('/foo/:bar/buzz')
 *   async getBar(
 *     @Query(({ key, source }) => {
 *       if (key === 'xEgo2') {
 *         return Number(source)
 *       } else if (key === 'xEgo3') {
 *         return Boolean(source)
 *       }
 *
 *       return source
 *     }, 'xEgo1', 'xEgo2', 'xEgo3') importedQuery: IQuery,
 *
 *     @Response() response: IHttpResponse
 *   ) {
 *     response.write(`xEgo1: ${importedQuery['xEgo1']} (${typeof importedQuery['xEgo1']})\n`)
 *     response.write(`xEgo2: ${importedQuery['xEgo2']} (${typeof importedQuery['xEgo2']})\n`)
 *     response.write(`xEgo3: ${importedQuery['xEgo3']} (${typeof importedQuery['xEgo3']})\n`)
 *   }
 * }
 * ```
 *
 * @param {string[]} [names] One or more headers to import. If the list is empty, all parameters are taken.
 *
 * @returns {ParameterDecorator} The new decorator function.
 */
export function Query(transformer: ParameterDataTransformer, ...names: string[]): ParameterDecorator;
export function Query(...names: string[]): ParameterDecorator;
export function Query(transformerOrName: ParameterDataTransformer | string, ...moreNames: string[]): ParameterDecorator {
    const names: string[] = [];

    let transformer: Nilable<ParameterDataTransformer>;
    if (typeof transformerOrName === "function") {
        transformer = transformerOrName;
        names.push(...moreNames);
    }
    else {
        names.push(transformerOrName, ...moreNames);
    }

    if (names.some((n) => {
        return typeof n !== "string";
    })) {
        throw new TypeError("All items of names must be of type string");
    }

    if (!isNil(transformer)) {
        if (typeof transformer !== "function") {
            throw new TypeError("transformerOrName must be of type string or function");
        }
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
                    "source": "queries",
                    "transformTo": transformer
                }
            }
        );
    };
}
