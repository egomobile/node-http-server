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

import type { Nilable } from "../types/internal.js";

/**
 * A middleware, which parses the body data.
 */
export interface IBodyParserMiddlewareOptions {
    /**
     * The custom limit, in bytes.
     *`null` indicates, that there should be no limit.
     *
     * @default 134217728
     */
    limit?: Nilable<number>;
}

/**
 * The default size of the body limit.
 */
export const defaultBodyLimit = 134217728;  // 128 MB

export * from "./buffer.js";
export * from "./json.js";
export * from "./text.js";
export * from "./validate.js";
export * from "./yaml";
