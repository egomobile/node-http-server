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

import type { HttpMiddleware } from "@egomobile/http-server";
import type { AnySchema } from "joi";
import type { Schema } from "../types/index.js";
import type { Nilable } from "../types/internal.js";

/**
 * A possible value for a 1st argument of a decorator
 * that sets up a route for a HTTP method that does not
 * accept a body.
 */
export type HttpMethodDecoratorArg1 =
    IHttpMethodDecoratorOptions |
    HttpMiddleware<any, any>[] |
    HttpMethodDecoratorRoutePath;

/**
 * A possible value for a 2nd argument of a decorator
 * that sets up a route for a HTTP method that does not
 * accept a body.
 */
export type HttpMethodDecoratorArg2 =
    HttpMiddleware<any, any>[];

/**
 * A possible value for a 3rd argument of a decorator
 * that sets up a route for a HTTP method that does not
 * accept a body.
 */
export type HttpMethodDecoratorArg3 = any;

/**
 * A possible value for a 1st argument of a decorator
 * that sets up a route for a HTTP method that also
 * accepts a body.
 */
export type HttpMethodDecoratorWithBodyArg1 =
    IHttpMethodDecoratorWithBodyOptions |
    HttpMiddleware<any, any>[] |
    HttpMethodDecoratorRoutePath |
    AnySchema;

/**
 * A possible value for a 2nd argument of a decorator
 * that sets up a route for a HTTP method that also
 * accepts a body.
 */
export type HttpMethodDecoratorWithBodyArg2 =
    HttpMiddleware<any, any>[] |
    Schema;

/**
 * A possible value for a 3rd argument of a decorator
 * that sets up a route for a HTTP method that also
 * accepts a body.
 */
export type HttpMethodDecoratorWithBodyArg3 = any;

/**
 * A possible, known value for an input format, that is supported
 * by a route, setuped by a HTTP method decorator.
 */
export type HttpMethodDecoratorWithBodyInputFormat =
    "buffer" | "json" | "json5" | "text" | "yaml";

/**
 * A possible value for a path of a controller route.
 */
export type HttpMethodDecoratorRoutePath = string;

/**
 * Options for a decorator, that sets up a route for a HTTP method
 * that does not accept a body.
 */
export interface IHttpMethodDecoratorOptions {
    /**
     * The custom (relative) path of the route.
     */
    path?: Nilable<string>;
    /**
     * List of one or more additional middlewares.
     */
    use?: Nilable<HttpMiddleware<any, any>[]>;
}

/**
 * Options for a decorator, that sets up a route for a HTTP method
 * that also accepts a body.
 */
export interface IHttpMethodDecoratorWithBodyOptions extends IHttpMethodDecoratorOptions {
    /**
     * The input format.
     *
     * @default "json"
     */
    bodyFormat?: Nilable<HttpMethodDecoratorWithBodyInputFormat>;

    /**
     * The schema to validate the body with.
     */
    schema?: Nilable<Schema>;
}

export * from "./CONNECT.js";
export * from "./Controller.js";
export * from "./DELETE.js";
export * from "./GET.js";
export * from "./HEAD.js";
export * from "./OPTIONS.js";
export * from "./PATCH.js";
export * from "./POST.js";
export * from "./PUT.js";
export * from "./TRACE.js";
