// This file is part of the @egomobile/http-controllers distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-controllers is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-controllers is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import type { Nilable } from "./internal.js";

/**
 * Options for `IHttpServer.controllers()` method.
 */
export interface IControllersOptions {
    /**
     * One or more glob patterns.
     *
     * In TypeScript environment like `ts-node`, default is `*.+(ts)`.
     * Otherwise `*.+(js)`.
     */
    patterns?: Nilable<string[]>;

    /**
     * The custom root directory of the controller files. Relative paths will be mapped to the current working directory.
     *
     * @default "controllers"
     */
    rootDir?: Nilable<string>;
}

/**
 * Result of `IHttpServer.controllers()` method.
 */
export interface IControllersResult {
}

export * from "./classes/index.js";
