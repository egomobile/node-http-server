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

import type { HttpMiddleware, HttpRequestHandler, IHttpBodyParserOptions } from '../types';
import { isNil, readStreamWithLimit, withEntityTooLarge } from '../utils';

/**
 * Options for 'json()' function.
 */
export interface IJsonOptions extends IHttpBodyParserOptions {
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
 */
export function json(): HttpMiddleware;
export function json(limit: number, onLimitReached?: HttpRequestHandler | null): HttpMiddleware;
export function json(options: IJsonOptions | null): HttpMiddleware;
export function json(optionsOrLimit?: number | IJsonOptions | null, onLimitReached?: HttpRequestHandler | null): HttpMiddleware {
    if (typeof optionsOrLimit === 'number') {
        // [0] number
        // [1] HttpRequestHandler

        optionsOrLimit = {
            limit: optionsOrLimit * 1048576
        };

        optionsOrLimit.onLimitReached = onLimitReached;
    }

    const limit = optionsOrLimit?.limit;
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

    return withEntityTooLarge(async (request, response, next) => {
        try {
            request.body = JSON.parse(
                (await readStreamWithLimit(request, limit)).toString('utf8')
            );
        } catch (error) {
            if (error instanceof SyntaxError) {
                if (!response.headersSent) {
                    response.writeHead(400);
                }

                response.end();
                return;
            }

            throw error;
        }

        next();
    }, onLimitReached);
}
