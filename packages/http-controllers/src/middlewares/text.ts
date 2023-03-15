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

import type { HttpMiddleware } from "@egomobile/http-server";
import type { Nilable } from "../types/internal.js";
import { readStreamWithLimit } from "../utils/internal.js";
import type { IBodyParserMiddlewareOptions } from "./index.js";
import { getBodyLimit } from "./utils.js";

/**
 * Options for `text()` function.
 */
export interface ITextOptions extends IBodyParserMiddlewareOptions {
}

/**
 * Creates a new middleware, which reads input data as UTF-8
 * string and writes this string to `body` property of the current request context.
 *
 * @param {Nilable<ITextOptions>} [options] Custom options.
 *
 * @returns {HttpMiddleware<any, any>} The new middleware.
 */
export function text(options?: Nilable<ITextOptions>): HttpMiddleware<any, any> {
    const limit = getBodyLimit(options?.limit);

    return async (request, response, next) => {
        request.body = (await readStreamWithLimit(request, limit)).toString("utf8");

        next();
    };
}
