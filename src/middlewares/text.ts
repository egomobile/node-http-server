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

import type { HttpRequestHandler, IHttpStringBodyParserOptions, UniqueHttpMiddleware } from "../types";
import type { Nilable, Nullable } from "../types/internal";
import { canHttpMethodHandleBodies, getBufferEncoding, isNil, limitToBytes, readStreamWithLimit, toUniqueHttpMiddleware, withEntityTooLarge } from "../utils";

interface ICreateMiddlewareOptions {
    encoding: BufferEncoding;
    limit: Nullable<number>;
    onLimitReached: Nilable<HttpRequestHandler>;
}

/**
 * Options for 'text()' function.
 */
export interface ITextOptions extends IHttpStringBodyParserOptions {
}

/**
 * Symbol defining the name of this middleware.
 */
export const textMiddleware: unique symbol = Symbol("text");

/**
 * Creates a middleware, that reads the whole input of the request stream,
 * converts it as string and writes the value to 'body' property of the request
 * context.
 *
 * @param {number} [limit] The limit in MB.
 * @param {Nilable<HttpRequestHandler>} [onLimitReached] The custom handler, that is invoked, when limit has been reached.
 * @param {Nilable<ITextOptions>} [options] Custom options.
 *
 * @returns {UniqueHttpMiddleware} The new middleware.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, text } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * // custom error handler
 * async function handleLimitReached(request: IHttpRequest, response: IHttpResponse) {
 *   request.writeHead(400)
 *   request.write('Input is too big')
 * }
 *
 * // maximum input size: 128 MB
 * app.post('/', text(), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(typeof request.body, 'object')
 * })
 *
 * // maximum input size: 256 MB
 * app.put('/', text(256), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(typeof request.body, 'object')
 * })
 *
 * // maximum input size: 384 MB
 * // encoding: ASCII
 * app.patch('/', text({ limit: 402653184, encoding: 'ascii' }), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(typeof request.body, 'object')
 * })
 *
 * app.delete('/', text({ limit: 1048576, onLimitReached: handleLimitReached }), async (request: IHttpRequest, response: IHttpResponse) => {
 * // alternative:
 * // app.delete('/', text(1, handleLimitReached), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(typeof request.body, 'object')
 * })
 * ```
 */
export function text(): UniqueHttpMiddleware;
export function text(limit: number, onLimitReached?: Nilable<HttpRequestHandler>): UniqueHttpMiddleware;
export function text(options: Nilable<ITextOptions>): UniqueHttpMiddleware;
export function text(optionsOrLimit?: Nilable<number | ITextOptions>, onLimitReached?: Nilable<HttpRequestHandler>): UniqueHttpMiddleware {
    if (typeof optionsOrLimit === "number") {
        // [0] number
        // [1] HttpRequestHandler

        optionsOrLimit = {
            "limit": limitToBytes(optionsOrLimit)
        };

        optionsOrLimit.onLimitReached = onLimitReached;
    }

    let limit = optionsOrLimit?.limit;
    if (typeof limit === "undefined") {
        limit = limitToBytes(128);
    }

    onLimitReached = optionsOrLimit?.onLimitReached;

    if (!isNil(limit)) {
        if (typeof limit !== "number") {
            throw new TypeError("limit must be of type number");
        }
    }

    if (!isNil(onLimitReached)) {
        if (typeof onLimitReached !== "function") {
            throw new TypeError("onLimitReached must be of type function");
        }
    }

    return createMiddleware({
        "encoding": getBufferEncoding(optionsOrLimit?.encoding),
        "limit": limit as Nullable<number>,
        onLimitReached
    });
}

function createMiddleware({ encoding, limit, onLimitReached }: ICreateMiddlewareOptions): UniqueHttpMiddleware {
    return toUniqueHttpMiddleware(textMiddleware, withEntityTooLarge(async (request, response, next) => {
        if (canHttpMethodHandleBodies(request.method)) {
            request.body = (await readStreamWithLimit(request, limit)).toString(encoding);
        }
        else {
            request.body = null;
        }

        next();
    }, onLimitReached));
}
