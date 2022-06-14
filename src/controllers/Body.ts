/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { ParameterDataTransformTo } from "../types";
import { createParameterDecorator } from "./factories";

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
    return createParameterDecorator({
        "options": {
            "source": "body",
            transformTo
        }
    });
}
