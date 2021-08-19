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

import type { HttpMiddleware, HttpRequestHandler, IHttpBodyParserOptions, ParseErrorHandler } from '../types';
import { ParseError } from '../errors/parse';
import { isNil, readStreamWithLimit, withEntityTooLarge } from '../utils';

/**
 * Options for 'json()' function.
 */
export interface IJsonOptions extends IHttpBodyParserOptions {
    /**
     * A custom parse error handler.
     */
    onParsingFailed?: ParseErrorHandler | null;
}

/**
 * Creates a middleware, that reads the whole input of the request stream,
 * parses it as JSON UTF-8 string and writes the object to 'body' property of the request
 * context.
 *
 * @param {number} [limit] The limit in MB.
 * @param {HttpRequestHandler|null} [onLimitReached] The custom handler, that is invoked, when limit has been reached.
 * @param {IJsonOptions|null|undefined} [options] Custom options.
 *
 * @returns {HttpMiddleware} The new middleware.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { json, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * async function handleLimitReached(request: IHttpRequest, response: IHttpResponse) {
 *     request.writeHead(400)
 *     request.write('Input is too big')
 * }
 *
 * // maximum input size: 128 MB
 * app.post('/', json(), async (request: IHttpRequest, response: IHttpResponse) => {
 *     assert.strictEqual(typeof request.body, 'object')
 * })
 *
 * // maximum input size: 256 MB
 * app.put('/', json(256), async (request: IHttpRequest, response: IHttpResponse) => {
 *     assert.strictEqual(typeof request.body, 'object')
 * })
 *
 * // maximum input size: 384 MB
 * app.patch('/', json({ limit: 402653184 }), async (request: IHttpRequest, response: IHttpResponse) => {
 *     assert.strictEqual(typeof request.body, 'object')
 * })
 *
 * // custom error handler
 * app.delete('/', json({ limit: 1048576, onLimitReached: handleLimitReached }), async (request: IHttpRequest, response: IHttpResponse) => {
 * // alternative:
 * // app.delete('/', json(1, handleLimitReached), async (request: IHttpRequest, response: IHttpResponse) => {
 *     assert.strictEqual(typeof request.body, 'object')
 * })
 * ```
 */
export function json(): HttpMiddleware;
export function json(limit: number, onLimitReached?: HttpRequestHandler | null, onParsingFailed?: ParseErrorHandler | null): HttpMiddleware;
export function json(options: IJsonOptions | null): HttpMiddleware;
export function json(optionsOrLimit?: number | IJsonOptions | null, onLimitReached?: HttpRequestHandler | null, onParsingFailed?: ParseErrorHandler | null): HttpMiddleware {
    if (typeof optionsOrLimit === 'number') {
        // [0] number
        // [1] HttpRequestHandler

        optionsOrLimit = {
            limit: optionsOrLimit * 1048576
        };

        optionsOrLimit.onLimitReached = onLimitReached;
        optionsOrLimit.onParsingFailed = onParsingFailed;
    }

    const limit = optionsOrLimit?.limit;
    onLimitReached = optionsOrLimit?.onLimitReached;
    onParsingFailed = optionsOrLimit?.onParsingFailed;

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

    if (isNil(onParsingFailed)) {
        onParsingFailed = require('.').defaultParseErrorHandler;
    } else {
        if (typeof onParsingFailed !== 'function') {
            throw new TypeError('onParsingFailed must be of type function');
        }
    }

    return withEntityTooLarge(async (request, response, next) => {
        try {
            request.body = JSON.parse(
                (await readStreamWithLimit(request, limit)).toString('utf8')
            );
        } catch (error) {
            if (error instanceof SyntaxError) {
                await onParsingFailed!(new ParseError(error), request, response);
                return;
            }

            throw error;
        }

        next();
    }, onLimitReached);
}
