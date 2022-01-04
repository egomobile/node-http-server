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

import jsYaml, { YAMLException } from 'js-yaml';
import { ParseError } from '../errors/parse';
import type { HttpMiddleware, HttpRequestHandler, IHttpStringBodyParserOptions, ParseErrorHandler } from '../types';
import type { Nilable, Nullable } from '../types/internal';
import { canHttpMethodHandleBodies, getBufferEncoding, isNil, limitToBytes, readStreamWithLimit, withEntityTooLarge } from '../utils';

interface ICreateMiddlewareOptions {
    encoding: string;
    limit: Nullable<number>;
    onLimitReached: Nilable<HttpRequestHandler>;
    onParsingFailed: ParseErrorHandler;
}

/**
 * Options for 'yaml()' function.
 */
export interface IYamlOptions extends IHttpStringBodyParserOptions {
    /**
     * A custom parse error handler.
     */
    onParsingFailed?: Nilable<ParseErrorHandler>;
}

/**
 * Creates a middleware, that reads the whole input of the request stream,
 * parses it as YAML UTF-8 string and writes the object to 'body' property of the request
 * context.
 *
 * @param {number} [limit] The limit in MB.
 * @param {Nilable<HttpRequestHandler>} [onLimitReached] The custom handler, that is invoked, when limit has been reached.
 * @param {Nilable<ParseErrorHandler>} [onParsingFailed] The custom handler, that is invoked, when input is no valid YAML.
 * @param {Nilable<IYamlOptions>} [options] Custom options.
 *
 * @returns {HttpMiddleware} The new middleware.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, yaml } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * // custom error handler
 * async function handleLimitReached(request: IHttpRequest, response: IHttpResponse) {
 *   request.writeHead(400)
 *   request.write('Input is too big')
 * }
 *
 * // maximum input size: 128 MB
 * app.post('/', yaml(), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(Array.isArray(request.body), true)
 * })
 *
 * // maximum input size: 256 MB
 * app.put('/', yaml(256), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(Array.isArray(request.body), true)
 * })
 *
 * // maximum input size: 384 MB
 * app.patch('/', yaml({ limit: 402653184 }), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(Array.isArray(request.body), true)
 * })
 *
 * app.delete('/', yaml({ limit: 1048576, onLimitReached: handleLimitReached }), async (request: IHttpRequest, response: IHttpResponse) => {
 * // alternative:
 * // app.delete('/', yaml(1, handleLimitReached), async (request: IHttpRequest, response: IHttpResponse) => {
 *   assert.strictEqual(Array.isArray(request.body), true)
 * })
 * ```
 */
export function yaml(): HttpMiddleware;
export function yaml(limit: number, onLimitReached?: Nilable<HttpRequestHandler>, onParsingFailed?: Nilable<ParseErrorHandler>): HttpMiddleware;
export function yaml(options: Nilable<IYamlOptions>): HttpMiddleware;
export function yaml(optionsOrLimit?: Nilable<number | IYamlOptions>, onLimitReached?: Nilable<HttpRequestHandler>, onParsingFailed?: Nilable<ParseErrorHandler>): HttpMiddleware {
    if (typeof optionsOrLimit === 'number') {
        // [0] number
        // [1] HttpRequestHandler

        optionsOrLimit = {
            limit: limitToBytes(optionsOrLimit)
        };

        optionsOrLimit.onLimitReached = onLimitReached;
        optionsOrLimit.onParsingFailed = onParsingFailed;
    }

    let limit = optionsOrLimit?.limit;
    if (typeof limit === 'undefined') {
        limit = limitToBytes(128);
    }

    onLimitReached = optionsOrLimit?.onLimitReached;
    onParsingFailed = optionsOrLimit?.onParsingFailed;

    if (!isNil(limit)) {
        if (typeof limit !== 'number') {
            throw new TypeError('limit must be of type number');
        }
    }

    if (!isNil(onLimitReached)) {
        if (typeof onLimitReached !== 'function') {
            throw new TypeError('onLimitReached must be of type function');
        }
    }

    if (isNil(onParsingFailed)) {
        onParsingFailed = require('.').defaultParseErrorHandler;
    } else {
        if (typeof onParsingFailed !== 'function') {
            throw new TypeError('onParsingFailed must be of type function');
        }
    }

    return createMiddleware({
        encoding: getBufferEncoding(optionsOrLimit?.encoding),
        limit: limit as Nullable<number>,
        onLimitReached,
        onParsingFailed: onParsingFailed!
    });
}

function createMiddleware({ encoding, limit, onLimitReached, onParsingFailed }: ICreateMiddlewareOptions): HttpMiddleware {
    return withEntityTooLarge(async (request, response, next) => {
        try {
            if (canHttpMethodHandleBodies(request.method)) {
                request.body = jsYaml.loadAll(
                    (await readStreamWithLimit(request, limit)).toString(encoding)
                );
            } else {
                request.body = null;
            }

            next();
        } catch (error) {
            if (error instanceof YAMLException) {
                await onParsingFailed!(new ParseError(error), request, response);

                response.end();
            } else {
                throw error;
            }
        }
    }, onLimitReached);
}
