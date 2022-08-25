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

import { URLSearchParams } from "url";
import type { UniqueHttpMiddleware } from "../types";
import { toUniqueHttpMiddleware } from "../utils";

/**
 * Symbol defining the name of this middleware.
 */
export const queryMiddleware: unique symbol = Symbol("query");

/**
 * Creates a new middleware that extracts query parameters
 * from URL and writes the data to 'query' property
 * of request context as key/value pairs.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, query } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * // try to access via: /?foo=bar
 * app.get('/', [query()], async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(typeof request.query!.get('foo'), 'string')
 * })
 *
 * await app.listen()
 * ```
 *
 * @returns {UniqueHttpMiddleware} The new middleware.
 */
export function query(): UniqueHttpMiddleware {
    return toUniqueHttpMiddleware(queryMiddleware, async (request, response, next) => {
        try {
            if (request.url?.length) {
                let qs = "";

                const qMark = request.url.indexOf("?");
                if (qMark > -1) {
                    qs = request.url.substring(qMark + 1);
                }

                if (qs.length) {
                    request.query = new URLSearchParams(qs);
                }
            }
        }
        catch { }

        if (!request.query) {
            request.query = new URLSearchParams();
        }

        next();
    });
}
