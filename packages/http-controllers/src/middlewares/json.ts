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
import json5 from "json5";
import type { JsonVersion } from "../types/index.js";
import type { Nilable, Nullable } from "../types/internal.js";
import { isNil, readStreamWithLimit } from "../utils/internal.js";
import type { IBodyParserMiddlewareOptions } from "./index.js";
import { getBodyLimit } from "./utils.js";

interface ICreateMiddlewareOptions {
    limit: Nullable<number>;
}

/**
 * Options for 'json()' function.
 */
export interface IJsonOptions extends IBodyParserMiddlewareOptions {
    /**
     * The custom version.
     */
    version?: Nilable<JsonVersion>;
}

/**
 * Creates a new middleware, which reads input data as UTF-8
 * string and tries to parse it to JSON object and writes this
 * object to `body` property of the current request context.
 *
 * @param {Nilable<IJsonOptions>} [options] Custom options.
 */
export function json(): HttpMiddleware<any, any>;
export function json(options: Nilable<IJsonOptions>): HttpMiddleware<any, any>;
export function json(options?: Nilable<IJsonOptions>): HttpMiddleware<any, any> {
    const jsonVersion = options?.version;
    const limit = getBodyLimit(options?.limit);

    if (isNil(jsonVersion)) {
        return createDefaultMiddleware({ limit });
    }
    else {
        if (![5].includes(jsonVersion)) {
            throw new TypeError("options.version must have value 5");
        }

        return createJson5Middleware({ limit });
    }
}

function createDefaultMiddleware({
    limit
}: ICreateMiddlewareOptions): HttpMiddleware<any, any> {
    return async (request, response, next) => {
        try {
            request.body = JSON.parse(
                (await readStreamWithLimit(request, limit)).toString("utf8")
            );

            next();
        }
        catch (error) {
            next(error);
        }
    };
}

function createJson5Middleware({
    limit
}: ICreateMiddlewareOptions): HttpMiddleware<any, any> {
    return async (request, response, next) => {
        try {
            request.body = json5.parse(
                (await readStreamWithLimit(request, limit)).toString("utf8")
            );

            next();
        }
        catch (error) {
            next(error);
        }
    };
}
