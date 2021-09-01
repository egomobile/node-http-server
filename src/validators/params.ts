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

import type { IncomingMessage } from 'http';
import { parse } from 'regexparam';
import type { HttpPathValidator, Nullable } from '../types';
import { getUrlWithoutQuery } from '../utils';

interface RegexParamResult {
    keys: string[];
    pattern: RegExp;
}

/**
 * Creates a new path validator that extracts parameters
 * from the path and writes the data to 'params' property
 * of request context as key/value pairs.
 *
 * @see https://github.com/lukeed/regexparam
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, params } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * app.get(params('/dirs/:dir/files/:file'), async (request: IHttpRequest, response: IHttpResponse) => {
 *     assert.strictEqual(typeof request.params!.dir, 'string')
 *     assert.strictEqual(typeof request.params!.file, 'string')
 * })
 *
 * await app.listen()
 * ```
 *
 * @param {string} path The path with parameters.
 *
 * @returns {HttpPathValidator} The new path validator.
 */
export function params(path: string): HttpPathValidator {
    const result: RegexParamResult = parse(path);

    return (req: IncomingMessage) => {
        try {
            const url = getUrlWithoutQuery(req.url) || '';

            const params = exec(url, result);
            if (params) {
                req.params = params;

                return true;
            }
        } catch { }

        return false;
    };
}

function exec(path: string, result: RegexParamResult): Nullable<Record<string, string>> {
    const matches = result.pattern.exec(path);
    if (!matches) {
        return null;
    }

    const paramList: Record<string, string> = {};

    for (let i = 0; i < result.keys.length; i++) {
        paramList[result.keys[i]] = decodeURIComponent(matches[i + 1]);
    }

    return paramList;
}
