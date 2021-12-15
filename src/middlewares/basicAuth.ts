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

import type { HttpMiddleware, IHttpRequest, IHttpResponse, Nilable, Nullable } from '../types';
import { asAsync, isNil } from '../utils';

/**
 * Usernames and passwords.
 */
export type BasicAuthCredentials = Record<string, string>;

/**
 * Handler that is invoked, that is invoked if
 * Basic Auth validation fails.
 *
 * @param {string} username The username.
 * @param {IHttpRequest} request The username context.
 * @param {IHttpResponse} response The response context.
 */
export type BasicAuthValidationFailedHandler = (username: Nilable<string>, request: IHttpRequest, response: IHttpResponse) => any;

/**
 * Validator, that checks for username and password.
 *
 * @param {Nilable<string>} username The username.
 * @param {Nullable<string>} password The password.
 * @param {IHttpRequest} request The request context.
 *
 * @returns {boolean|PromiseLike<boolean>} A truely value, that indicates, if criteria do match, or the promise with it.
 */
export type BasicAuthValidator = (username: Nilable<string>, password: Nullable<string>, request: IHttpRequest) => boolean | PromiseLike<boolean>;

interface ICreateMiddlewareOptions {
    onValidationFailed: BasicAuthValidationFailedHandler;
    validator: BasicAuthValidator;
}

/**
 * Default handler, that is invoked, when a auth validation fails.
 *
 * @param {string|undefined} username The username.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export const defaultBasicAuthFailedHandler: BasicAuthValidationFailedHandler = async (username, request, response) => {
    if (!response.headersSent) {
        response.writeHead(401, {
            'Content-Type': '0',
            'WWW-Authenticate': 'Basic realm="Restricted Area"'
        });
    }
};

/**
 * Creates a new middleware, that checks, if Authorization header is valid or not.
 *
 * @example
 * ```
 * import createServer, { basicAuth, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * const usersAndPasswords: BasicAuthCredentials = {
 *   'bill': 'G@tez1234$',
 *   'marcel': 'fooPassword',
 *   'tanja': 'barPasswd1234'
 * }
 *
 * app.get('/', basicAuth(usersAndPasswords), async (response: IHttpRequest, response: IHttpResponse) => {
 *   // your code, if credentials are valid
 * })
 * ```
 *
 * @param {string} username The username.
 * @param {string} password The password.
 * @param {Nilable<AuthValidationFailedHandler>} [onValidationFailed] The custom handler, that is invoked, if validation fails.
 * @param {BasicAuthValidator} validator The validator.
 * @param {BasicAuthCredentials} credentails Credentails.
 */
export function basicAuth(username: string, password: string, onValidationFailed?: Nilable<BasicAuthValidationFailedHandler>): HttpMiddleware;
export function basicAuth(validator: BasicAuthValidator, onValidationFailed?: Nilable<BasicAuthValidationFailedHandler>): HttpMiddleware;
export function basicAuth(credentails: BasicAuthCredentials, onValidationFailed?: Nilable<BasicAuthValidationFailedHandler>): HttpMiddleware;
export function basicAuth(arg1: string | BasicAuthValidator | BasicAuthCredentials, arg2?: Nilable<string | BasicAuthValidationFailedHandler>, arg3?: Nilable<BasicAuthValidationFailedHandler>): HttpMiddleware {
    let validator: BasicAuthValidator;
    let onValidationFailed: Nilable<BasicAuthValidationFailedHandler>;

    if (typeof arg1 === 'string') {
        // [arg1] username
        // [arg2] password
        // [arg3] onValidationFailed

        validator = (username, password) => username === arg1 && password === arg2;
        onValidationFailed = arg3 as BasicAuthValidationFailedHandler;
    } else if (typeof arg1 === 'function') {
        // [arg1] validator
        // [arg2] onValidationFailed

        validator = arg1 as BasicAuthValidator;
        onValidationFailed = arg2 as BasicAuthValidationFailedHandler;
    } else if (typeof arg1 === 'object') {
        // [arg1] credentails
        // [arg2] onValidationFailed

        validator = createValidatorFromCredentials(arg1 as BasicAuthCredentials);
        onValidationFailed = arg2 as BasicAuthValidationFailedHandler;
    } else {
        throw new TypeError('First argument must be of type string, object or function');
    }

    if (typeof validator !== 'function') {
        throw new TypeError('Validator must be of type function');
    }

    if (!isNil(onValidationFailed)) {
        if (typeof onValidationFailed !== 'function') {
            throw new TypeError('onValidationFailed must be of type function');
        }
    }

    return createMiddleware({
        onValidationFailed: onValidationFailed || defaultBasicAuthFailedHandler,
        validator
    });
}

function createValidatorFromCredentials(credentials: BasicAuthCredentials): BasicAuthValidator {
    return async (username, password) => {
        if (typeof credentials[username!] === 'string') {
            return credentials[username!] === password;
        }

        return false;
    };
}

function createMiddleware({ onValidationFailed, validator }: ICreateMiddlewareOptions): HttpMiddleware {
    validator = asAsync(validator);
    onValidationFailed = asAsync(onValidationFailed);

    return async (request, response, next) => {
        let isValid = false;
        let username: Nilable<string>;

        try {
            const authorization = request.headers['authorization'];
            if (typeof authorization === 'string') {
                username = null;

                let scheme: string;
                let value: string;

                // Authorization: <scheme> <value>
                const sep = authorization.indexOf(' ');
                if (sep > -1) {
                    scheme = authorization.substr(0, sep);
                    value = authorization.substr(sep + 1);
                } else {
                    scheme = authorization;
                    value = '';
                }

                if (scheme.toLowerCase() === 'basic') {  // must be 'basic'
                    let password: Nullable<string>;

                    // BASE64(username:password)
                    const usernameAndPassword = Buffer.from(value, 'base64')
                        .toString('utf8');

                    // username:password
                    const sep2 = usernameAndPassword.indexOf(':');
                    if (sep2 > -1) {
                        username = usernameAndPassword.substr(0, sep2);
                        password = usernameAndPassword.substr(sep2 + 1);
                    } else {
                        username = usernameAndPassword;
                        password = null;
                    }

                    isValid = await validator(username, password, request);
                }
            }
        } catch { }

        if (isValid) {
            next();
        } else {
            await onValidationFailed(username, request, response);

            response.end();
        }
    };
}
