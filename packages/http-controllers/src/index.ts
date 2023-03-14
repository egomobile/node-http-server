/* eslint-disable spaced-comment */

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

/// <reference path="../index.d.ts" />

import { HttpServerExtender, moduleMode } from "@egomobile/http-server";
import path from "node:path";
import { initializeControllers } from "./factories/controllers.js";
import type { IControllersOptions } from "./types/index.js";
import { isNil, runsTSNode } from "./utils/internal.js";

export function extendWithControllers<TRequest, TResponse>(): HttpServerExtender<TRequest, TResponse> {
    return ({ server }) => {
        // extend `server` instance with
        // `controllers` method.
        server.controllers = async (...args: any[]) => {
            let options: IControllersOptions;
            if (isNil(args[0])) {
                options = {};
            }
            else {
                if (typeof args[0] === "string") {
                    options = {
                        "rootDir": args[0]
                    };
                }
                else if (typeof args[0] === "object") {
                    options = args[0];
                }
                else {
                    throw new TypeError("First argument must be of type string or object");
                }
            }

            if (typeof options !== "object") {
                throw new TypeError("options must be of type object");
            }

            let rootDir = options.rootDir;
            if (isNil(rootDir)) {
                rootDir = "controllers";
            }

            if (typeof rootDir !== "string") {
                throw new TypeError("options.rootDir must be of type string");
            }

            let patterns = options.patterns;
            if (isNil(patterns)) {
                patterns = [];
            }

            if (!patterns.length) {
                const extensions: string[] = [];

                if (runsTSNode()) {
                    extensions.push("ts");

                    if (moduleMode === "cjs") {
                        extensions.push("cts");
                    }
                    else if (moduleMode === "esm") {
                        extensions.push("mts");
                    }
                }
                else {
                    extensions.push("js");

                    if (moduleMode === "cjs") {
                        extensions.push("cjs");
                    }
                    else if (moduleMode === "esm") {
                        extensions.push("mjs");
                    }
                }

                patterns.push(`**/*.{${extensions.join()}}`);
            }

            if (!path.isAbsolute(rootDir)) {
                rootDir = path.join(process.cwd(), rootDir);
            }

            return initializeControllers({
                patterns,
                rootDir,
                server
            });
        };
    };
}

export * from "./decorators/index.js";
export * from "./types/index.js";

export default extendWithControllers;
