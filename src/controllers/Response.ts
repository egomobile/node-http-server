/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { createParameterDecorator } from "./factories";

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
    return createParameterDecorator({
        "options": {
            "source": "response"
        }
    });
}
