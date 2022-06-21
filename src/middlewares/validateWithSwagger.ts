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

import OpenAPIRequestValidator, { OpenAPIRequestValidatorArgs } from "openapi-request-validator";
import type { OpenAPIV3 } from "openapi-types";
import { defaultJsonSchemaValidationFailedHandler } from ".";
import type { HttpMiddleware, JsonSchemaValidationFailedHandler } from "../types";
import { Nilable } from "../types/internal";
import { asAsync, urlSearchParamsToObject } from "../utils";

interface ICreateMiddlewareOptions {
    documentation: OpenAPIV3.OperationObject;
    onValidationFailed: JsonSchemaValidationFailedHandler;
}

/**
 * Options for 'validateWithSwagger()' function.
 */
export interface IValidateWithSwaggerOptions {
    /**
     * The documentation to use as schema for the validation.
     */
    documentation: OpenAPIV3.OperationObject;
    /**
     * The custom error handler.
     */
    onValidationFailed?: Nilable<JsonSchemaValidationFailedHandler>;
}

/**
 * Creates a new middleware, which checks the request data with
 * a Swagger documentation for an endpoint.
 *
 * @example
 * ```
 * import createServer, { query, validateWithSwagger } from '@egomobile/http-server'
 * import type { OpenAPIV3.OperationObject } from 'openapi-types'
 *
 * const swaggerDocumentOfGetRequest: OpenAPIV3.OperationObject = {
 *   "parameters": [
 *     {
 *       in: 'query',
 *       name: 'foo',
 *       required: true
 *     },
 *     "responses": {}
 *   ]
 * }
 *
 * const app = createServer()
 *
 * app.get(
 *   '/',
 *   [
 *     query(),
 *     validateWithSwagger(swaggerDocumentOfGetRequest)
 *   ],
 *   async (request, response) => {
 *     assert.strictEqual(typeof request.query!.get('foo'), 'string')
 *   }
 * )
 *
 * // ...
 * ```
 *
 * @param {IValidateWithSwaggerOptions} options The options.
 *
 * @returns {HttpMiddleware} The new middleware.
 */
export function validateWithSwagger(options: IValidateWithSwaggerOptions): HttpMiddleware {
    if (typeof options !== "object") {
        throw new TypeError("options must be of type object");
    }

    const onValidationFailed = options.onValidationFailed || defaultJsonSchemaValidationFailedHandler;
    if (typeof onValidationFailed !== "function") {
        throw new TypeError("options.onValidationFailed must be of type function");
    }

    return createMiddleware({
        "documentation": options.documentation,
        "onValidationFailed": asAsync<JsonSchemaValidationFailedHandler>(onValidationFailed)
    });
}

function createMiddleware({ documentation, onValidationFailed }: ICreateMiddlewareOptions): HttpMiddleware {
    return async (request, response, next) => {
        const validatorArgs: OpenAPIRequestValidatorArgs = {
            "parameters": documentation.parameters ?? undefined,
            "requestBody": (documentation.requestBody as OpenAPIV3.RequestBodyObject) ?? undefined
        };

        const validator = new OpenAPIRequestValidator(validatorArgs);

        const validationResult = validator.validateRequest({
            "headers": request.headers,
            "body": request.body,
            "params": request.params ?? undefined,
            "query": urlSearchParamsToObject(request.query) ?? undefined
        });

        if (!validationResult?.errors?.length) {
            next();
        }
        else {
            await onValidationFailed(validationResult.errors, request, response);

            response.end();
        }
    };
}
