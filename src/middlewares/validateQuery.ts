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

import { AnySchema, isSchema } from 'joi';
import { defaultQueryValidationFailedHandler } from '.';
import type { HttpMiddleware, ValidationFailedHandler } from '../types';
import type { Nilable } from '../types/internal';
import { isNil, urlSearchParamsParamsToObject } from '../utils';

interface ICreateMiddlewareOptions {
    onValidationFailed: ValidationFailedHandler;
    schema: AnySchema;
}

/**
 * Options for 'validateQuery()' function.
 */
export interface IValidateQueryOptions {
    /**
     * The custom error handler.
     */
    onValidationFailed?: Nilable<ValidationFailedHandler>;
}

/**
 * Creates a middleware, that validates the data of the 'body' property
 * inside the 'request' object with the help of a joi schema.
 *
 * @param {AnySchema} schema The schema to use.
 * @param {Nilable<ValidationFailedHandler>} [onValidationFailed] The handler, that is executed, if data is invalid.
 * @param {Nilable<IValidateOptions>} [options] Custom options.
 *
 * @returns {HttpMiddleware} The new middleware.
 *
 * @see https://www.npmjs.com/package/joi
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, json, query, schema, validateQuery } from '@egomobile/http-server'
 *
 * const myQuerySchema = schema.object({
 *   offset: schema.string().strict().regex(/^(0-9){1,}$/).required(),
 *   limit: joi.string().strict().regex(/^(0-9){1,}$/).optional()
 * })
 *
 * const app = createServer()
 *
 * app.get('/', [query(), validateQuery(myQuerySchema)], (request, response) => {
 *   assert.strictEqual(typeof request.query!.get('offset'), 'string')
 *   assert.strictEqual(isNaN(request.query!.get('offset')), false)
 *
 *   if (request.query!.get('limit')) {
 *     assert.strictEqual(typeof request.query!.get('limit'), 'string')
 *     assert.strictEqual(isNaN(request.query!.get('limit')), false)
 *   }
 * })
 *
 * // ...
 * ```
 */
export function validateQuery(schema: AnySchema): HttpMiddleware;
export function validateQuery(schema: AnySchema, onValidationFailed: ValidationFailedHandler): HttpMiddleware;
export function validateQuery(schema: AnySchema, options: IValidateQueryOptions): HttpMiddleware;
export function validateQuery(schema: AnySchema, optionsOrErrorHandler?: Nilable<IValidateQueryOptions | ValidationFailedHandler>): HttpMiddleware {
    if (!isSchema(schema)) {
        throw new TypeError('schema must be a Joi object');
    }

    let options: Nilable<IValidateQueryOptions>;
    if (!isNil(optionsOrErrorHandler)) {
        if (typeof optionsOrErrorHandler === 'function') {
            options = {
                onValidationFailed: optionsOrErrorHandler
            };
        } else {
            options = optionsOrErrorHandler;
        }
    }

    const onValidationFailed = options?.onValidationFailed || defaultQueryValidationFailedHandler;
    if (typeof onValidationFailed !== 'function') {
        throw new TypeError('onValidationFailed must be of type function');
    }

    return createMiddleware({
        onValidationFailed,
        schema
    });
}

function createMiddleware({ onValidationFailed, schema }: ICreateMiddlewareOptions): HttpMiddleware {
    return async (request, response, next) => {
        const validationResult = schema.validate(
            urlSearchParamsParamsToObject(request.query)
        );

        if (validationResult.error) {
            await onValidationFailed(validationResult.error, request, response);

            response.end();
        } else {
            next();
        }
    };
}
