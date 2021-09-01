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

import youch from 'youch';
import { defaultGetStatusCodeFromError } from '.';
import { isNil } from '../utils';
import type { GetStatusCodeFromError, HttpErrorHandler, Nilable } from '../types';

interface ICreateHandlerOptions {
    getStatusCode: GetStatusCodeFromError;
}

/**
 * Options for 'prettyErrors()' function.
 */
export interface IPrettyErrorsOptions {
    getStatusCode?: Nilable<GetStatusCodeFromError>;
}

/**
 * Creates a new error handler, that outputs pretty error messages.
 *
 * @param {Nilable<IPrettyErrorsOptions>} [options] Custom options.
 *
 * @see https://github.com/poppinss/youch
 *
 * @example
 * ```
 * import createServer, { prettyErrors } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * app.get('/', async (request, response) => {
 *   throw new ReferenceError('Oops! Something went wrong!')
 * })
 *
 * app.setErrorHandler(prettyErrors())
 *
 * await app.listen()
 * ```
 *
 * @returns {HttpErrorHandler} The new handler.
 */
export function prettyErrors(): HttpErrorHandler;
export function prettyErrors(code: number): HttpErrorHandler;
export function prettyErrors(getStatusCode: GetStatusCodeFromError): HttpErrorHandler;
export function prettyErrors(arg?: Nilable<GetStatusCodeFromError | IPrettyErrorsOptions | number>): HttpErrorHandler {
    let options: Nilable<IPrettyErrorsOptions>;
    if (!isNil(arg)) {
        if (typeof arg === 'object') {
            options = arg;
        } else {
            options = {};

            if (typeof arg === 'number') {
                options.getStatusCode = createGetStatusCodeFromErrorHandler(arg);
            } else if (typeof arg === 'function') {
                options.getStatusCode = arg;
            } else {
                throw new TypeError('Argument must be of type object, function or number');
            }
        }
    }

    const getStatusCode = options?.getStatusCode || defaultGetStatusCodeFromError;
    if (typeof getStatusCode !== 'function') {
        throw new TypeError('getStatusCode must be of type function');
    }

    return createHandler({
        getStatusCode
    });
}

function createGetStatusCodeFromErrorHandler(code: number): GetStatusCodeFromError {
    return () => code;
}

function createHandler({ getStatusCode }: ICreateHandlerOptions): HttpErrorHandler {
    return async (error, request, response) => {
        const html = Buffer.from(
            await (new youch(error, request)).toHTML(),
            'utf8'
        );

        if (!response.headersSent) {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.setHeader('Content-Length', String(html.length));

            response.writeHead(getStatusCode(error));
        }

        response.write(html);
        response.end();
    };
}
