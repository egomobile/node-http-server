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

import type { AnySchema } from "joi";
import type { JSONSchema4, JSONSchema6, JSONSchema7 } from "json-schema";
import type { ControllerBase } from "../index.js";
import type { Constructor, Nilable } from "./internal.js";

/**
 * Context of an event, that is emitted, after a controller instance has been created.
 */
export interface IControllerCreatedEventContext {
    /**
     * The new instance.
     */
    controller: ControllerBase;
    /**
     * The class of the controller.
     */
    controllerClass: Constructor<ControllerBase>;
    /**
     * The full path of the underlying file.
     */
    fullPath: string;
    /**
     * The relative path of the underlying file.
     */
    relativePath: string;
}

/**
 * Options for `IHttpServer.controllers()` method.
 */
export interface IControllersOptions {
    /**
     * Indicates, if default behavior of closing request connection automatically, should be
     * deactivated or not.
     */
    noAutoEnd?: Nilable<boolean>;

    /**
     * Indicates, if default behavior of automatically setup parameters, should be
     * deactivated or not.
     */
    noAutoParams?: Nilable<boolean>;

    /**
     * If `true`, do not parse query parameters automatically in this handler.
     */
    noAutoQuery?: Nilable<boolean>;

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

/**
 * A possible value for JSON schema.
 */
export type JsonSchema = JSONSchema4 | JSONSchema6 | JSONSchema7;

/**
 * Possible values for JSON version.
 */
export type JsonVersion = 5;

/**
 * A possible value for a schema.
 */
export type Schema = AnySchema | JsonSchema;

export * from "./classes/index.js";
