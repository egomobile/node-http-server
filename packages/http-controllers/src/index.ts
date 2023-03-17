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
import ajv from "ajv";
import joi from "joi";
import path from "node:path";
import { initializeControllers } from "./factories/controllers.js";
import type { IControllersOptions } from "./types/index.js";
import { isNil, runsTSNode } from "./utils/internal.js";

/**
 * ID for an event, that is emitted after a controller instance has been created.
 */
export const controllerCreatedEvent: unique symbol = Symbol("controller:created");

/**
 * Extends an `IHttpServer` instance with controller features.
 *
 * @returns {HttpServerExtender<TRequest, TResponse>} The extender.
 */
export function extendWithControllers<TRequest, TResponse>(): HttpServerExtender<TRequest, TResponse> {
    return ({ events, server }) => {
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
                        "rootDir": args[0],
                        "imports": args[1]
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

            const imports = options?.imports;
            if (!isNil(imports)) {
                if (typeof imports !== "object") {
                    throw new TypeError("options.imports must be of type object");
                }
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
                events,
                "imports": imports ?? {},
                "noAutoEnd": options?.noAutoEnd,
                "noAutoParams": options?.noAutoParams,
                "noAutoQuery": options?.noAutoQuery,
                patterns,
                rootDir,
                server
            });
        };
    };
}

export * from "./decorators/index.js";
export * from "./errors/index.js";
export * from "./middlewares/index.js";
export * from "./types/index.js";

/**
 * Alias for `ajv` module.
 */
export const jsonSchema = ajv;
/**
 * Alias for `joi` module.
 */
export const schema = joi;

/**
 * @inheritdoc
 */
export default extendWithControllers;
