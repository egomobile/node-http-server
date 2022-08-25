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

import type { HttpRequestHandler, IHttpRequest, IHttpResponse, UniqueHttpMiddleware } from "../types";
import type { Nilable } from "../types/internal";
import { asAsync, isNil, toUniqueHttpMiddleware } from "../utils";

/**
 * A function, that validates an API key.
 *
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The request context.
 *
 * @returns {any} Should return a truely value or a promise with it.
 */
export type ApiKeyValidator = (request: IHttpRequest, response: IHttpResponse) => any;

/**
 * Options for 'apiKey()' function.
 */
export interface IApiKeyOptions {
    /**
     * The action, that is invoked, when validation failed.
     */
    onValidationFailed?: Nilable<HttpRequestHandler>;
    /**
     * The function, that validates the request.
     */
    validator: ApiKeyValidator;
}

interface ICreateMiddlewareOptions {
    onValidationFailed: HttpRequestHandler;
    validator: ApiKeyValidator;
}

/**
 * Symbol defining the name of this middleware.
 */
export const apiKeyMiddleware: unique symbol = Symbol("apiKey");

/**
 * The default name of the HTTP header for an API key.
 */
export const defaultApiKeyHeader = "x-api-key";

/**
 * The default handler, that is invoked, when an API key validation failed.
 *
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export const defaultApiKeyValidationFailedHandler: HttpRequestHandler = async (request, response) => {
    if (!response.headersSent) {
        response.writeHead(401, {
            "Content-Length": "0"
        });
    }
};

/**
 * Creates a middleware, that checks for an API key.
 *
 * @param {Nilable<string>} header The custom header name. Default: 'x-api-key'
 * @param {string} key The key.
 * @param {ApiKeyValidator} validator The validator.
 * @param {Nilable<IApiKeyOptions>} [options] Custom options.
 *
 * @returns {UniqueHttpMiddleware} The new middleware.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { ApiKeyValidator, HttpRequestHandler, IHttpRequest, IHttpResponse, apiKey } from '@egomobile/http-server'
 *
 * // custom validator function
 * const myApiKeyValidator: ApiKeyValidator =
 *   async (request: IHttpRequest) => request.headers['x-key'] === 'mySecretApiKey3'
 *
 * // custom error handler
 * const onValidationFailed: HttpRequestHandler = async (request: IHttpRequest, response: IHttpResponse) => {
 *   const errorMessage = Buffer.from('Wrong API key!', 'utf8')
 *
 *   response.writeHead(403, {
 *     'Content-Length': String(errorMessage.length)
 *   });
 *
 *   response.write(errorMessage)
 * }
 *
 * const app = createServer()
 *
 * // check 'x-api-key' header for 'mySecretApiKey1'
 * app.get('/foo', [apiKey('mySecretApiKey1')], async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(request.headers['x-api-key'], 'mySecretApiKey1')
 * })
 *
 * // check 'x-key' header for 'mySecretApiKey2'
 * app.get('/bar', [apiKey('mySecretApiKey2', 'x-key')], async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(request.headers['x-key'], 'mySecretApiKey2')
 * })
 *
 * // use function to validate
 * app.get('/baz', [apiKey(myApiKeyValidator)], async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(request.headers['x-key'], 'mySecretApiKey3')
 * })
 *
 * // with custom error handler
 * app.get('/test', [apiKey(myApiKeyValidator, onValidationFailed)], async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(request.headers['x-key'], 'mySecretApiKey3')
 * })
 * ```
 */
export function apiKey(options: IApiKeyOptions): UniqueHttpMiddleware;
export function apiKey(validator: ApiKeyValidator, onValidationFailed?: HttpRequestHandler): UniqueHttpMiddleware;
export function apiKey(key: string): UniqueHttpMiddleware;
export function apiKey(key: string, header: string): UniqueHttpMiddleware;
export function apiKey(key: string, header: string, onValidationFailed?: Nilable<HttpRequestHandler>): UniqueHttpMiddleware;
export function apiKey(key: string, onValidationFailed: HttpRequestHandler): UniqueHttpMiddleware;
export function apiKey(
    arg1: IApiKeyOptions | ApiKeyValidator | string,  // options | validator | key
    arg2?: Nilable<string | HttpRequestHandler>,  // onValidationFailed | header
    arg3?: Nilable<HttpRequestHandler>  // onValidationFailed
): UniqueHttpMiddleware {
    let onValidationFailed: Nilable<HttpRequestHandler>;
    let validator: ApiKeyValidator;

    if (typeof arg1 === "object") {
        // args[0] => IApiKeyOptions

        validator = arg1.validator as ApiKeyValidator;
        onValidationFailed = arg1.onValidationFailed;
    }
    else if (typeof arg1 === "string") {
        // args[0] => string
        // args[1] => string | HttpRequestHandler;
        // args[2] => HttpRequestHandler

        let header: Nilable<string>;

        if (typeof arg2 === "function") {
            onValidationFailed = arg2;
        }
        else {
            header = arg2;
            onValidationFailed = arg3;
        }

        if (!isNil(header)) {
            if (typeof header !== "string") {
                throw new TypeError("header must be of type string");
            }
        }

        validator = createApiKeyValidator((header || defaultApiKeyHeader).toLowerCase().trim(), arg1);
    }
    else {
        // args[0] => ApiKeyValidator
        // args[1] => HttpRequestHandler

        validator = arg1 as ApiKeyValidator;
        onValidationFailed = arg2 as HttpRequestHandler;
    }

    if (typeof validator !== "function") {
        throw new TypeError("validator must be of type function");
    }

    if (!isNil(onValidationFailed)) {
        if (typeof onValidationFailed !== "function") {
            throw new TypeError("onValidationFailed must be of type function");
        }
    }

    return createMiddleware({
        "onValidationFailed": asAsync(onValidationFailed || defaultApiKeyValidationFailedHandler),
        "validator": asAsync(validator)
    });
}

function createMiddleware({ onValidationFailed, validator }: ICreateMiddlewareOptions): UniqueHttpMiddleware {
    return toUniqueHttpMiddleware(apiKeyMiddleware, async (request, response, next) => {
        let isValid = false;
        try {
            isValid = await validator(request, response);
        }
        catch { }

        if (isValid) {
            next();
        }
        else {
            await onValidationFailed(request, response);

            response.end();
        }
    });
}

function createApiKeyValidator(header: string, key: string): ApiKeyValidator {
    return async (request) => {
        return request.headers[header] === key;
    };
}
