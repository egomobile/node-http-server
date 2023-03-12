/* eslint-disable spaced-comment */

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

/// <reference path="../index.d.ts" />

import { createHttp1Server, CreateHttp1ServerOptions, createHttp2Server, CreateHttp2ServerOptions, IHttp1Server, IHttp2Server } from "./server/index.js";
import type { HttpMethod, HttpServerVersion } from "./types/index.js";
import type { Nilable } from "./types/internal.js";
import { isNil } from "./utils/internal.js";

/**
 * List of known HTTP methods.
 */
export const httpMethods: readonly HttpMethod[] = ["connect", "delete", "get", "head", "options", "patch", "post", "put", "trace"] as const;

/**
 * Indicates in which mode this module is currently running in.
 */
export const moduleMode = typeof module !== "undefined" && typeof module?.exports !== "undefined" ?
    "cjs" :
    "esm";

/**
 * Creates a new server instance.
 *
 * @param {Nilable<CreateHttp1ServerOptions | CreateHttp2ServerOptions>} [options] Custom options.
 * @param {HttpServerVersion} [version=1] The custom HTTP version.
 *
 * @returns {IHttp1Server|IHttp2Server} The new instance.
 */
export function createServer(): IHttp1Server;
export function createServer(options: Nilable<CreateHttp1ServerOptions>): IHttp1Server;
export function createServer(version: 1, options?: Nilable<CreateHttp1ServerOptions>): IHttp1Server;
export function createServer(version: 2, options?: Nilable<CreateHttp2ServerOptions>): IHttp2Server;
export function createServer(versionOrOptions?: Nilable<HttpServerVersion | CreateHttp1ServerOptions>, options?: Nilable<CreateHttp1ServerOptions | CreateHttp2ServerOptions>): IHttp1Server | IHttp2Server {
    let version: HttpServerVersion;
    let createOptions: Nilable<CreateHttp1ServerOptions | CreateHttp2ServerOptions>;
    if (isNil(versionOrOptions)) {
        version = 1;
        createOptions = versionOrOptions as Nilable<CreateHttp1ServerOptions | CreateHttp2ServerOptions>;
    }
    else {
        if (typeof versionOrOptions === "number") {
            version = versionOrOptions as HttpServerVersion;
            createOptions = options;
        }
        else {
            version = 1;
            createOptions = versionOrOptions as (CreateHttp1ServerOptions | CreateHttp2ServerOptions);
        }
    }

    if (version === 1) {
        return createHttp1Server(createOptions as Nilable<CreateHttp1ServerOptions>);
    }

    if (version === 2) {
        return createHttp2Server(createOptions as Nilable<CreateHttp2ServerOptions>);
    }

    throw new TypeError("version must be of value 1 or 2");
}

/**
 * @inheritdoc
 */
export default createServer;

export * from "./errors/index.js";
export * from "./server/index.js";
export * from "./types/index.js";
export * from "./validators/index.js";
