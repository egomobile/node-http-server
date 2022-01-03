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

import type { HttpMiddleware, HttpRequestHandler, IHttpBodyParserOptions, Nilable, Nullable } from '../types';
import { canHttpMethodHandleBodies, isNil, limitToBytes, readStreamWithLimit, withEntityTooLarge } from '../utils';

/**
 * Options for 'buffer()' function.
 */
export interface IBufferOptions extends IHttpBodyParserOptions {
}

interface ICreateMiddlewareOptions {
    limit: Nullable<number>;
    onLimitReached: Nilable<HttpRequestHandler>;
}

/**
 * Creates a middleware, that reads the whole input of the request stream
 * and writes data to 'body' property of the request
 * context as buffer.
 *
 * @param {number} [limit] The limit in MB.
 * @param {Nilable<HttpRequestHandler>} [onLimitReached] The custom handler, that is invoked, when limit has been reached.
 * @param {Nilable<IBufferOptions>} [options] Custom options.
 *
 * @returns {HttpMiddleware} The new middleware.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { buffer, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
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
 * app.post('/', buffer(), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(Buffer.isBuffer(request.body), true)
 * })
 *
 * // maximum input size: 256 MB
 * app.put('/', buffer(256), async (request: IHttpRequest, response: IHttpResponse) => {
 *     assert.strictEqual(Buffer.isBuffer(request.body), true)
 * })
 *
 * // maximum input size: 384 MB
 * app.patch('/', buffer({ limit: 402653184 }), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(Buffer.isBuffer(request.body), true)
 * })
 *
 * app.delete('/', buffer({ limit: 1048576, onLimitReached: handleLimitReached }), async (request: IHttpRequest, response: IHttpResponse) => {
 * // alternative:
 * // app.delete('/', buffer(1, handleLimitReached), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(Buffer.isBuffer(request.body), true)
 * })
 * ```
 */
export function buffer(): HttpMiddleware;
export function buffer(limit: number, onLimitReached?: Nilable<HttpRequestHandler>): HttpMiddleware;
export function buffer(options: Nilable<IBufferOptions>): HttpMiddleware;
export function buffer(optionsOrLimit?: Nilable<IBufferOptions | number>, onLimitReached?: Nilable<HttpRequestHandler>): HttpMiddleware {
    if (typeof optionsOrLimit === 'number') {
        optionsOrLimit = {
            limit: limitToBytes(optionsOrLimit)
        };

        optionsOrLimit.onLimitReached = onLimitReached;
    }

    let limit = optionsOrLimit?.limit;
    if (typeof limit === 'undefined') {
        limit = limitToBytes(128);
    }

    onLimitReached = optionsOrLimit?.onLimitReached;

    if (!isNil(limit)) {
        if (typeof limit !== 'number') {
            throw new TypeError('limit must be of type number');
        }
    }

    if (!isNil(onLimitReached)) {
        if (typeof onLimitReached !== 'function') {
            throw new TypeError('onLimitReached must be of type function');
        }
    }

    return createMiddleware({
        limit: limit as Nullable<number>,
        onLimitReached
    });
}

function createMiddleware({ limit, onLimitReached }: ICreateMiddlewareOptions) {
    return withEntityTooLarge(async (request, response, next) => {
        if (canHttpMethodHandleBodies(request.method)) {
            request.body = await readStreamWithLimit(request, limit);
        } else {
            request.body = null;
        }

        next();
    }, onLimitReached);
}
