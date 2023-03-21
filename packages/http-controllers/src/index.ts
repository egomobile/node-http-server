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

import type { HttpServerExtender } from "@egomobile/http-server";
import ajv from "ajv";
import joi from "joi";
import { initializeControllersMethod } from "./factories/controllers.js";
import { initializeTestMethod } from "./factories/tests.js";
import type { IControllersOptions, IControllersResult } from "./types/index.js";
import type { Optional } from "./types/internal.js";
import { isTruthy } from "./utils/internal.js";

/**
 * Extends an `IHttpServer` instance with controller features.
 *
 * @returns {HttpServerExtender<TRequest, TResponse>} The extender.
 */
export function extendWithControllers<TRequest, TResponse>(): HttpServerExtender<TRequest, TResponse> {
    return (context) => {
        const {
            events,
            server
        } = context;

        let lastControllersResult: Optional<IControllersResult>;
        let lastControllersOptions: Optional<IControllersOptions>;
        const shouldRunTests = isTruthy(process?.env?.EGO_RUN_TESTS);

        // server.controllers()
        initializeControllersMethod({
            events,
            "onControllersOptionsChange": (newOptions) => {
                lastControllersOptions = newOptions;
            },
            "onControllersResultChange": (newResult) => {
                lastControllersResult = newResult;
            },
            server
        });

        // server.test()
        initializeTestMethod({
            "extenderContext": context,
            "getLastControllersOptions": () => {
                return lastControllersOptions;
            },
            "getLastControllersResult": () => {
                return lastControllersResult;
            },
            server
        });

        if (shouldRunTests) {
            context.on("server:listen", (lc) => {
                // tell server NOT to start listening on
                // TCP port
                lc.dryRun = true;
            });

            context.on("server:listening", () => {
                server.test()
                    .then(() => {
                        process.exit(0);
                    })
                    .catch((error) => {
                        console.error("[HTTP SERVER TESTS]", error);

                        process.exit(1);
                    });
            });
        }
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
