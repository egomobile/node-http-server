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
import { defaultValidationFailedHandler } from '.';
import type { HttpMiddleware, ValidationFailedHandler } from '../types';
import type { Nilable } from '../types/internal';
import { isNil } from '../utils';

interface ICreateMiddlewareOptions {
    onValidationFailed: ValidationFailedHandler;
    schema: AnySchema;
}

/**
 * Options for 'validate()' function.
 */
export interface IValidateOptions {
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
 * import createServer, { IHttpRequest, IHttpResponse, json, schema, validate } from '@egomobile/http-server'
 *
 * interface IMySchema {
 *   email: string;
 *   name?: string;
 * }
 *
 * const mySchema = schema.object({
 *   email: schema.string().strict().trim().email().required(),
 *   name: schema.string().strict().trim().min(1).optional()
 * })
 *
 * const app = createServer()
 *
 * app.post('/', [json(), validate(mySchema)], (request, response) => {
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
export function validate(schema: AnySchema): HttpMiddleware;
export function validate(schema: AnySchema, onValidationFailed: ValidationFailedHandler): HttpMiddleware;
export function validate(schema: AnySchema, options: IValidateOptions): HttpMiddleware;
export function validate(schema: AnySchema, optionsOrErrorHandler?: Nilable<IValidateOptions | ValidationFailedHandler>): HttpMiddleware {
    if (!isSchema(schema)) {
        throw new TypeError('schema must be a Joi object');
    }

    let options: Nilable<IValidateOptions>;
    if (!isNil(optionsOrErrorHandler)) {
        if (typeof optionsOrErrorHandler === 'function') {
            options = {
                onValidationFailed: optionsOrErrorHandler
            };
        } else {
            options = optionsOrErrorHandler;
        }
    }

    const onValidationFailed = options?.onValidationFailed || defaultValidationFailedHandler;
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
        const validationResult = schema.validate(request.body);

        if (validationResult.error) {
            await onValidationFailed(validationResult.error, request, response);

            response.end();
        } else {
            next();
        }
    };
}
