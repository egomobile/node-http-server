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

import Ajv, { Options as AjvOptions } from "ajv";
import { defaultSchemaValidationFailedHandler } from ".";
import type { JsonSchema, SchemaValidationFailedHandler, UniqueHttpMiddleware } from "../types";
import type { Constructor, Nilable, Optional } from "../types/internal";
import { clone, isClass, isNil, toUniqueHttpMiddleware } from "../utils";

interface ICreateMiddlewareOptions {
    onValidationFailed: SchemaValidationFailedHandler;
    options: Optional<AjvOptions>;
    schema: JsonSchema;
    validatorClass: Constructor<Ajv>;
}

/**
 * Options for 'validateAjv()' function.
 */
export interface IValidateAjvOptions {
    /**
     * The custom error handler.
     */
    onValidationFailed?: Nilable<SchemaValidationFailedHandler>;
    /**
     * Custom options for `Ajv` instance.
     */
    options?: Nilable<AjvOptions>;
    /**
     * A custom validator class.
     */
    validatorClass?: Nilable<Constructor<any>>;
}

/**
 * Symbol defining the name of this middleware.
 */
export const validateAjvMiddleware: unique symbol = Symbol("validateAjv");

/**
 * Creates a middleware, that validates the data of the 'body' property
 * inside the 'request' object with the help of a Ajv/JSON schema.
 *
 * @param {JsonSchema} schema The schema to use.
 * @param {Nilable<ValidationFailedHandler>} [onValidationFailed] The handler, that is executed, if data is invalid.
 * @param {Nilable<IValidateAjvOptions>} [options] Custom options.
 *
 * @returns {UniqueHttpMiddleware} The new middleware.
 *
 * @see https://www.npmjs.com/package/ajv
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, json, JSONSchema7, validateAjv } from '@egomobile/http-server'
 *
 * interface IMySchema {
 *   email: string;
 *   name?: string;
 * }
 *
 * // by default, following settings will be auto-set, if not defined:
 * //
 * // - `mySchema.additionalProperties` === `false`
 * const mySchema: JSONSchema7 = {
 *   type: "object",
 *   required: ["email"],
 *   properties: {
 *     email: {
 *       type: "string",
 *       pattern: "^(([^<>()[\\].,;:\\s@\"]+(\\.[^<>()[\\].,;:\\s@\"]+)*)|(\".+\"))@(([^<>()[\\].,;:\\s@\"]+\\.)+[^<>()[\\].,;:\\s@\"]{2,})$"
 *     },
 *     name: {
 *       type: "string",
 *       minLength: 1,
 *       pattern: "^(\\S+)(.*)(\\S*)$"
 *     }
 *   }
 * };
 *
 * const app = createServer()
 *
 * app.post('/', [json(), validateAjv(mySchema)], (request, response) => {
 *   const body: IMySchema = request.body
 *
 *   assert.strictEqual(typeof body, 'object')
 *   assert.strictEqual(typeof body.email, 'string')
 *
 *   if (typeof body.name !== 'undefined') {
 *     assert.strictEqual(typeof body.name, 'string')
 *     assert.strictEqual(body.name.length > 0, true)
 *   }
 * })
 *
 * // ...
 * ```
 */
export function validateAjv(schema: JsonSchema): UniqueHttpMiddleware;
export function validateAjv(schema: JsonSchema, onValidationFailed: SchemaValidationFailedHandler): UniqueHttpMiddleware;
export function validateAjv(schema: JsonSchema, options: IValidateAjvOptions): UniqueHttpMiddleware;
export function validateAjv(schema: JsonSchema, optionsOrErrorHandler?: Nilable<IValidateAjvOptions | SchemaValidationFailedHandler>): UniqueHttpMiddleware {
    if (typeof schema !== "object") {
        throw new TypeError("schema must be of type object");
    }

    // clone and setup defaults, if required
    schema = clone(schema);
    if (isNil(schema.additionalProperties)) {
        schema.additionalProperties = false;
    }

    let options: Nilable<IValidateAjvOptions>;
    if (!isNil(optionsOrErrorHandler)) {
        if (typeof optionsOrErrorHandler === "function") {
            options = {
                "onValidationFailed": optionsOrErrorHandler
            };
        }
        else {
            options = optionsOrErrorHandler;
        }
    }

    let validatorClass: Constructor<any>;
    if (isNil(options?.validatorClass)) {
        validatorClass = Ajv;
    }
    else {
        if (!isClass(options!.validatorClass)) {
            throw new TypeError("options.validatorClass must be a class");
        }

        validatorClass = options!.validatorClass;
    }

    let ajvOptions: Optional<AjvOptions>;
    if (!isNil(options?.options)) {
        if (typeof options?.options !== "object") {
            throw new TypeError("options.options must be of type object");
        }

        ajvOptions = options!.options;
    }

    const onValidationFailed = options?.onValidationFailed || defaultSchemaValidationFailedHandler;
    if (typeof onValidationFailed !== "function") {
        throw new TypeError("onValidationFailed must be of type function");
    }

    return createMiddleware({
        "options": ajvOptions,
        onValidationFailed,
        schema,
        validatorClass
    });
}

function createMiddleware({ onValidationFailed, options, schema, validatorClass }: ICreateMiddlewareOptions): UniqueHttpMiddleware {
    return toUniqueHttpMiddleware(validateAjvMiddleware, async (request, response, next) => {
        const validate = new validatorClass(options).compile(schema);
        const isValid = validate(request.body);

        if (isValid) {
            next();
        }
        else {
            await onValidationFailed(validate.errors!, request, response);

            response.end();
        }
    });
}
