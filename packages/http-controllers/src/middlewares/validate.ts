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
import Ajv from "ajv";
import { AnySchema, isSchema } from "joi";
import type { JsonSchema, Schema } from "../types/index.js";
import type { Nilable, Nullable } from "../types/internal.js";
import { asAsync, isNil } from "../utils/internal.js";

interface ICreateMiddlewareOptions<TSchema> {
    onValidationFailed: ValidationFailedHandler<any, any>;
    schema: TSchema;
}

/**
 * A validation error.
 */
export interface IValidationError {
    /**
     * A context, if available.
     */
    context: Nullable<string>;
    /**
     * The details.
     */
    details: string;
    /**
     * The message text.
     */
    message: string;
}

/**
 * A function, that is invoked, when validation of body data
 * fails against a schema fails.
 *
 * @param {IValidationError[]} errors The errors.
 * @param {TRequest} request The request context.
 * @param {TResponse} response The response context.
 */
export type ValidationFailedHandler<TRequest, TResponse> =
    (errros: IValidationError[], request: TRequest, response: TResponse) => any;

/**
 * The default function, which is invoked when validation of body data
 * fails against a schema fails.
 *
 * @param {IValidationError[]} errors The list of errors.
 * @param {any} request The request context.
 * @param {any} response The response context.
 */
export const defaultValidationFailedHandler: ValidationFailedHandler<any, any> =
    async (errors, request, response) => {
        const errorMessage = Buffer.from(
            errors.map(error => {
                return error.message;
            }).join("\n"),
            "utf8"
        );

        if (!response.headersSent) {
            response.writeHead(400, {
                "Content-Type": "text/plain; charset=UTF-8",
                "Content-Length": errorMessage.length
            });
        }

        response.end(errorMessage);
    };

/**
 * Creates a new middleware, which validates value in
 * `body` property of request context against a schema.
 *
 * @param {Schema} schema The schema.
 * @param {Nilable<ValidationFailedHandler<any, any>>} [onValidationFailed] The custom validation error handler.
 *
 * @returns {HttpMiddleware<any, any>} The new middleare.
 */
export function validate(schema: Schema, onValidationFailed?: Nilable<ValidationFailedHandler<any, any>>): HttpMiddleware<any, any> {
    if (isNil(onValidationFailed)) {
        onValidationFailed = defaultValidationFailedHandler;
    }

    if (typeof onValidationFailed !== "function") {
        throw new TypeError("onValidationFailed must be of type function");
    }

    if (isSchema(schema)) {
        return createJoiMiddleware({
            "onValidationFailed": asAsync<ValidationFailedHandler<any, any>>(onValidationFailed),
            schema
        });
    }
    else if (typeof schema === "object") {
        return createAjvMiddleware({
            "onValidationFailed": asAsync<ValidationFailedHandler<any, any>>(onValidationFailed),
            schema
        });
    }
    else {
        throw new TypeError("schema must be a Joi schema or an object");
    }
}

function createAjvMiddleware({
    onValidationFailed,
    schema
}: ICreateMiddlewareOptions<JsonSchema>): HttpMiddleware<any, any> {
    const ajv = new Ajv();

    return async (request, response, next) => {
        const validate = ajv.compile(schema);
        const isValid = validate(request.body);

        if (isValid) {
            next();
        }
        else {
            const errors: IValidationError[] = validate.errors?.map((error) => {
                return {
                    "context": error.dataPath || null,
                    "details": `[${error.dataPath}] ${error.message}`,
                    "message": error.message || ""
                };
            }) ?? [];

            await onValidationFailed(errors, request, response);

            // we are in a middleware, so we have to
            // close anything by ourself
            response.end();
        }
    };
}

function createJoiMiddleware({
    onValidationFailed,
    schema
}: ICreateMiddlewareOptions<AnySchema>): HttpMiddleware<any, any> {
    return async (request, response, next) => {
        const validationResult = schema.validate(request.body);

        if (!validationResult.error) {
            next();
        }
        else {
            const errors: IValidationError[] = [{
                "context": null,
                "details": validationResult.error.details.map((item) => {
                    return `[${item.type}; ${item.path}] ${item.message}`;
                }).join("\n"),
                "message": validationResult.error.message
            }];

            await onValidationFailed(errors, request, response);

            // we are in a middleware, so we have to
            // close anything by ourself
            response.end();
        }
    };
}
