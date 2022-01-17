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

import type { HttpMiddleware, HttpRequestHandler, IHttpRequest } from '../types';
import type { Nilable, Optional } from '../types/internal';
import { asAsync, isNil } from '../utils';

/**
 * Handler that is invoked, if validation of
 * 'Authorization' header fails.
 */
export type AuthValidationFailedHandler = HttpRequestHandler;

/**
 * Validator, that checks scheme and value of an
 * 'Authorization' header.
 *
 * @param {string} scheme The name of the scheme in lower case characters.
 * @param {string} value The value of the Authorization header.
 * @param {IHttpRequest} request The request context.
 *
 * @returns {boolean|PromiseLike<boolean>} A truely value, that indicates, if criteria do match, or the promise with it.
 */
export type AuthValidator = (scheme: string, value: string, request: IHttpRequest) => boolean | PromiseLike<boolean>;

/**
 * Validator, that checks value of an 'Authorization' header.
 *
 * @param {string} value The value of the Authorization header.
 * @param {IHttpRequest} request The request context.
 *
 * @returns {boolean|PromiseLike<boolean>} A truely value, that indicates, if criteria do match, or the promise with it.
 */
export type AuthValidatorWithoutScheme = (value: string, request: IHttpRequest) => boolean | PromiseLike<boolean>;

/**
 * List of auth validators, grouped by schemes.
 */
export type IAuthValidators = {
    /**
     * @see https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-auth-using-authorization-header.html
     */
    'aws4-hmac-sha256'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc7617
     */
    'basic'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc6750
     */
    'bearer'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc7616
     */
    'digest'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc7486
     */
    'hoba'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc8120
     */
    'mutal'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://www.ietf.org/rfc/rfc4559.txt
     */
    'negotiate'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc7804
     */
    'scram-sha-256'?: Optional<AuthValidatorWithoutScheme>;
    /**
     * @see https://datatracker.ietf.org/doc/html/rfc8292
     */
    'vapid'?: Optional<AuthValidatorWithoutScheme>;

    /**
     * Custom schemes and their validators.
     */
    [scheme: string]: Optional<AuthValidatorWithoutScheme>;
};

interface ICreateMiddlewareOptions {
    onValidationFailed: AuthValidationFailedHandler;
    validator: AuthValidator;
}

/**
 * Default handler, that is invoked, when a auth validation fails.
 *
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export const defaultAuthFailedHandler: AuthValidationFailedHandler = async (request, response) => {
    if (!response.headersSent) {
        response.writeHead(401, {
            'Content-Type': '0'
        });
    }
};

/**
 * Creates a new middleware, that checks, if Authorization header is valid or not.
 *
 * @example
 * ```
 * import createServer, { auth, AuthValidatorWithoutScheme, IHttpRequest, IHttpResponse } from '@egomobile/http-server'
 *
 * const checkBearer: AuthValidatorWithoutScheme = async (value: string, request: IHttpRequest, response: IHttpResponse) => {
 *   // client must submit something like
 *   // 'Authorization: Bearer myBearerValue'
 *   return value === 'myBearerValue'
 * }
 *
 * const app = createServer()
 *
 * // check if authorization header uses 'Bearer' scheme
 * // and its value matches all criteria of 'checkBearer()'
 * app.get('/', auth('Bearer', checkBearer), async (response, response) => {
 *   // your code, if bearer value is valid
 * })
 * ```
 *
 * @param {string} scheme The scheme.
 * @param {string} value The value, next to scheme.
 * @param {Nilable<AuthValidationFailedHandler>} [onValidationFailed] The custom handler, that is invoked, if validation fails.
 */
export function auth(scheme: string, value: string, onValidationFailed?: Nilable<AuthValidationFailedHandler>): HttpMiddleware;
export function auth(scheme: string, validator: AuthValidatorWithoutScheme, onValidationFailed?: Nilable<AuthValidationFailedHandler>): HttpMiddleware;
export function auth(validators: IAuthValidators, onValidationFailed?: Nilable<AuthValidationFailedHandler>): HttpMiddleware;
export function auth(arg1: string | IAuthValidators, arg2?: Nilable<string | AuthValidatorWithoutScheme | AuthValidationFailedHandler>, arg3?: Nilable<AuthValidationFailedHandler>): HttpMiddleware {
    let validator: AuthValidator;
    let onValidationFailed: Nilable<AuthValidationFailedHandler>;

    if (typeof arg1 === 'string') {
        // [arg1] scheme
        // [arg3] onValidationFailed

        const validators: IAuthValidators = {};

        if (typeof arg2 === 'string') {
            // [arg2] value
            validators[arg1] = (value) => value === arg2 as string;
        } else if (typeof arg2 === 'function') {
            // [arg2] validator
            validators[arg1] = arg2 as AuthValidatorWithoutScheme;
        } else {
            throw new TypeError('Second argument must be of type string or function');
        }

        validator = createValidatorFromObject(validators);
        onValidationFailed = arg3 as AuthValidationFailedHandler;
    } else if (typeof arg1 === 'object') {
        // [arg1] validators
        // [arg2] onValidationFailed

        validator = createValidatorFromObject(arg1);
        onValidationFailed = arg2 as AuthValidationFailedHandler;
    } else {
        throw new TypeError('First argument must be of type string or object');
    }

    if (typeof validator !== 'function') {
        throw new TypeError('validator must be of type function');
    }

    if (!isNil(onValidationFailed)) {
        if (typeof onValidationFailed !== 'function') {
            throw new TypeError('onValidationFailed must be of type function');
        }
    }

    return createMiddleware({
        onValidationFailed: onValidationFailed || defaultAuthFailedHandler,
        validator
    });
}

function createMiddleware({ onValidationFailed, validator }: ICreateMiddlewareOptions): HttpMiddleware {
    validator = asAsync(validator);
    onValidationFailed = asAsync(onValidationFailed);

    return async (request, response, next) => {
        let isValid = false;
        try {
            const authorization = request.headers['authorization'];
            if (typeof authorization === 'string') {
                let scheme: string;
                let value: string;

                const sep = authorization.indexOf(' ');
                if (sep > -1) {
                    scheme = authorization.substring(0, sep);
                    value = authorization.substring(sep + 1);
                } else {
                    scheme = authorization;
                    value = '';
                }

                isValid = await validator(scheme.toLowerCase(), value, request);
            }
        } catch { }

        if (isValid) {
            next();
        } else {
            await onValidationFailed(request, response);

            response.end();
        }
    };
}

function createValidatorFromObject(validatorsInput: Nilable<IAuthValidators>): AuthValidator {
    // make keys / schemes lower case
    const validators: IAuthValidators = {};
    for (const [key, value] of Object.entries(validatorsInput || {})) {
        validators[key.toLowerCase().trim()] = value;
    }

    validatorsInput = undefined;

    return (scheme, value, request) => {
        const v = validators[scheme];

        return (v && v(value, request)) as any;
    };
}
