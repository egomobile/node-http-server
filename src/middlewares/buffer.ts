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
export interface IBufferOptions extends IHttpBodyParserOptions {
}

/**
 * Creates a middleware, that reads the whole input of the request stream
 * and writes data to 'body' property of the request
 * context as buffer.
 *
 * @param {number} [limit] The limit in MB.
 * @param {HttpRequestHandler|null} [onLimitReached] The custom handler, that is invoked, when limit has been reached.
 * @param {IJsonOptions|null|undefined} [options] Custom options.
 *
 * @returns {HttpMiddleware} The new middleware.
 */
export function buffer(): HttpMiddleware;
export function buffer(limit: number, onLimitReached?: HttpRequestHandler | null): HttpMiddleware;
export function buffer(options: IBufferOptions | null): HttpMiddleware;
export function buffer(optionsOrLimit?: number | IBufferOptions | null, onLimitReached?: HttpRequestHandler | null): HttpMiddleware {
    if (typeof optionsOrLimit === 'number') {
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
        if (typeof onLimitReached !== 'number') {
            throw new TypeError('onLimitReached must be of type function');
        }
    }

    return withEntityTooLarge(async (request, response, next) => {
        request.body = await readStreamWithLimit(request, limit);

        next();
    }, onLimitReached);
}
