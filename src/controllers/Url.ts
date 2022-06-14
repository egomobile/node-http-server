/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { ParameterDataTransformer } from "../types";
import type { Nilable } from "../types/internal";
import { isNil } from "../utils";
import { createParameterDecorator } from "./factories";

/**
 * Imports one or more URL parameters into an argument / parameter of a handler
 * as key/value pair.
 *
 * @example
 * ```
 * // index.ts
 *
 * import { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse, Request, Response, Url } from '@egomobile/http-server'
 *
 * interface IUrl {
 *   "bar": string;
 *   "buzz": number;
 * }
 *
 * @Controller()
 * export default class IndexController extends ControllerBase {
 *   @GET('/foo/:bar/:buzz')
 *   async getBar(
 *     @Url(({ key, source }) => {
 *       if (key === 'buzz') {
 *         return Number(source)
 *       }
 *
 *       return source
 *     }, 'bar', 'buzz') importedUrl: IUrl,
 *
 *     @Response() response: IHttpResponse
 *   ) {
 *     response.write(`bar: ${importedHeaders['bar']} (${typeof importedHeaders['bar']})\n`)
 *     response.write(`buzz: ${importedHeaders['buzz']} (${typeof importedHeaders['buzz']})\n`)
 *   }
 * }
 * ```
 *
 * @param {string[]} [names] One or more headers to import. If the list is empty, all parameters are taken.
 * @param {ParameterDataTransformer} [transformer] The custom transformer function to use.
 *
 * @returns {ParameterDecorator} The new decorator function.
 */
export function Url(transformer: ParameterDataTransformer, ...names: string[]): ParameterDecorator;
export function Url(...names: string[]): ParameterDecorator;
export function Url(transformerOrName: ParameterDataTransformer | string, ...moreNames: string[]): ParameterDecorator {
    const names: string[] = [];
    let transformer: Nilable<ParameterDataTransformer>;

    if (arguments.length > 0) {
        if (typeof transformerOrName === "function") {
            transformer = transformerOrName;
            names.push(...moreNames);
        }
        else {
            names.push(transformerOrName, ...moreNames);
        }
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

    return createParameterDecorator({
        "options": {
            names,
            "source": "urls",
            "transformTo": transformer
        }
    });
}
