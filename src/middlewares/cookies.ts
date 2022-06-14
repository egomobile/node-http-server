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

import type { HttpMiddleware } from "../types";

/**
 * Creates a new middleware that parses submitted cookies
 * into 'cookies' property of request context as key/value pairs.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, cookies } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * // try submit 'cookie' HTTP header
 * // with 'foo=bar; baz=MKTM'
 * app.get('/', [cookies()], async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(request.cookies!.foo, 'bar')
 *   assert.strictEqual(request.cookies!.baz, 'MKTM')
 * })
 *
 * await app.listen()
 * ```
 *
 * @returns {HttpMiddleware} The new middleware.
 */
export function cookies(): HttpMiddleware {
    return async (request, response, next) => {
        request.cookies = {};

        if (typeof request.headers["cookie"] === "string") {
            const cookieList = request.headers["cookie"]
                .split(";")
                .map(c => {
                    return c.trim();
                })
                .filter(c => {
                    return c !== "";
                });

            for (const c of cookieList) {
                let name: string;
                let value: string;

                const sep = c.indexOf("=");
                if (sep > -1) {
                    name = c.substring(0, sep);
                    value = c.substring(sep + 1);
                }
                else {
                    name = c;
                    value = "";
                }

                request.cookies[name.trim()] = value;
            }
        }

        next();
    };
}