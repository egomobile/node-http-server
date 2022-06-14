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

import type { IncomingMessage } from "http";
import type { HttpPathValidator } from "../types";
import type { Nullable } from "../types/internal";
import { getUrlWithoutQuery } from "../utils";

interface IRegexParamResult {
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
    if (typeof path !== "string") {
        throw new TypeError("path must be of type string");
    }

    const result: IRegexParamResult = parse(path);

    return (req: IncomingMessage) => {
        try {
            const url = getUrlWithoutQuery(req.url) || "";

            const params = exec(url, result);
            if (params) {
                req.params = params;

                return true;
            }
        }
        catch { }

        return false;
    };
}

function exec(path: string, result: IRegexParamResult): Nullable<Record<string, string>> {
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

/**
 * This code is based on 'regexparam' v2.0.0 by Luke Edwards.
 *
 * @see https://github.com/lukeed/regexparam
 * @see https://github.com/lukeed
 * @see https://www.npmjs.com/package/regexparam
 *
 * @param {string} str The input string.
 *
 * @returns {RegexParamResult} The result.
 *
 * @license MIT
 */
function parse(str: string): IRegexParamResult {
    let c, o, tmp, ext, keys = [], pattern = "", arr = str.split("/");
    // eslint-disable-next-line no-unused-expressions
    arr[0] || arr.shift();

    while (tmp = arr.shift()) {
        c = tmp[0];
        if (c === "*") {
            keys.push("wild");
            pattern += "/(.*)";
        }
        else if (c === ":") {
            o = tmp.indexOf("?", 1);
            ext = tmp.indexOf(".", 1);
            keys.push(tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length));
            pattern += !!~o && !~ext ? "(?:/([^/]+?))?" : "/([^/]+?)";
            if (!!~ext) {
                pattern += (!!~o ? "?" : "") + "\\" + tmp.substring(ext);
            }
        }
        else {
            pattern += "/" + tmp;
        }
    }

    return {
        keys,
        "pattern": new RegExp("^" + pattern + "\/?$", "i")
    };
}
