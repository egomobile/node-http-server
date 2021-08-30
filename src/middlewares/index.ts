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

import type { HttpRequestHandler, ParseErrorHandler } from '../types';

/**
 * Default limit of a body parser: 128 MB
 */
export const defaultBodyLimit = 134217728;

/**
 * The default 'body limit reached' handler.
 *
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export const defaultLimitReachedHandler: HttpRequestHandler = async (request, response) => {
    if (!response.headersSent) {
        response.writeHead(413, {
            'Content-Length': '0'
        });
    }

    response.end();
};

/**
 * The default 'parse error' handler.
 *
 * @param {ParseError} error The error.
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export const defaultParseErrorHandler: ParseErrorHandler = async (error, request, response) => {
    if (!response.headersSent) {
        response.writeHead(400, {
            'Content-Length': '0'
        });
    }

    response.end();
};

export * from './buffer';
export * from './json';
export * from './query';
