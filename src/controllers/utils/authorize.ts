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

import { compileExpression } from 'filtrex';
import type { AuthorizeArgumentValue, AuthorizedUserProvider, AuthorizeFailedHandler, AuthorizeRolesProvider, AuthorizeRolesValue, AuthorizeValidator, HttpMiddleware, IAuthorizeOptions, IAuthorizeValidatorContext, SetupAuthorizeMiddlewareHandler } from '../../types';
import type { InitControllerAuthorizeAction, Nilable } from '../../types/internal';
import { asAsync, isNil } from '../../utils';

interface ICreateAuthorizeMiddlewareFromOptionsOptions {
    findAuthorizedUser: AuthorizedUserProvider;
    onValidationFailed: Nilable<AuthorizeFailedHandler>;
    rolesProvider: AuthorizeRolesProvider;
    validator: AuthorizeValidator;
}

export interface ICreateInitControllerAuthorizeActionOptions {
    arg: Nilable<AuthorizeArgumentValue>;
}

export function createInitControllerAuthorizeAction({ arg }: ICreateInitControllerAuthorizeActionOptions): InitControllerAuthorizeAction {
    const options = toAuthorizeOptions(arg);

    return ({ globalOptions, middlewares }) => {
        if (!options) {
            return;  // nothing to do here
        }

        // prepare and normalize functions and handlers
        const onValidationFailed = options.validator || globalOptions?.authorize?.onValidationFailed;
        const setupAuthorizeMiddleware = toSetupAuthorizeMiddlewareHandlerSafe(
            options.setupMiddleware || globalOptions?.authorize?.setupMiddleware
        );
        const findAuthorizedUser = asAsync<AuthorizedUserProvider>(
            toControllersAuthorizedUserProviderSafe(
                options.findAuthorizedUser || globalOptions?.authorize?.findAuthorizedUser
            )
        );
        const rolesProvider = asAsync<AuthorizeRolesProvider>(
            toAuthorizeRolesProviderSafe(options.roles)
        );
        const validator = asAsync<AuthorizeValidator>(
            toAuthorizeValidatorSafe(options.validator || globalOptions?.authorize?.validator)
        );
        const use = options.use || globalOptions?.authorize?.use;

        const authorizeMiddlewares = [
            createAuthorizeMiddlewareFromOptions({
                findAuthorizedUser,
                onValidationFailed,
                rolesProvider,
                validator
            })
        ];

        if (use?.length) {
            authorizeMiddlewares.unshift(...use);
        }

        setupAuthorizeMiddleware({
            authorizeMiddlewares,
            middlewares: middlewares
        });
    };
}

export function createAuthorizeValidatorFromExpression(expression: string): AuthorizeValidator {
    return async ({ request, roles }) => {
        if (request.authorizedUser) {
            // we new an authorized user here

            try {
                const filter = compileExpression(expression, {
                    extraFunctions: {
                        hasHeader: (name: string, value: any) => request.headers[name] === value,
                        hasRole: (r: any) => !!request.authorizedUser?.roles.includes(r),
                        log: (value: any, returnValue = true) => {
                            console.log(value);
                            return returnValue;
                        },
                        trace: (value: any, returnValue = true) => {
                            console.trace(value);
                            return returnValue;
                        }
                    }
                });

                return !!filter({
                    request,
                    roles,
                    user: request.authorizedUser
                });
            } catch { }
        }

        return false;
    };
}

function createAuthorizeMiddlewareFromOptions({
    findAuthorizedUser,
    onValidationFailed,
    rolesProvider,
    validator
}: ICreateAuthorizeMiddlewareFromOptionsOptions): HttpMiddleware {
    if (!onValidationFailed) {
        // use default
        onValidationFailed = async (reason, request, response) => {
            if (!response.headersSent) {
                response.writeHead(403, {
                    'Content-Length': '0'
                });
            }
        };
    }
    onValidationFailed = asAsync<AuthorizeFailedHandler>(onValidationFailed);

    return async (request, response, next) => {
        let reason: any = new Error('Validation failed');

        try {
            // get roles and convert from role names to objects
            const roles = await rolesProvider({
                request
            });

            // now get authorized user
            const authorizedUser = await findAuthorizedUser({
                request
            });
            if (authorizedUser) {
                // and set it to request context

                request.authorizedUser = {
                    roles: authorizedUser.roles || []
                };
            }

            const context: IAuthorizeValidatorContext = {
                request,
                response,
                roles
            };

            if (await validator(context)) {
                next();  // validation was successful => continue

                return;
            }
        } catch (error) {
            reason = error;
        }

        await onValidationFailed!(reason, request, response);

        response.end();
    };
}

function toAuthorizeOptions(arg1: Nilable<AuthorizeArgumentValue>): Nilable<IAuthorizeOptions> {
    let options: Nilable<IAuthorizeOptions>;
    if (arg1) {
        if (typeof arg1 === 'string') {
            // arg1 => validatorExpression
            options = {
                validator: createAuthorizeValidatorFromExpression(arg1)
            };
        } else if (typeof arg1 === 'function') {
            // arg1 => AuthorizeValidator
            options = {
                validator: arg1
            };
        } else if (Array.isArray(arg1)) {
            // arg1 => AuthorizeRoles
            options = {
                roles: arg1
            };
        } else {
            // arg1 => options
            options = arg1;
        }
    }

    if (!isNil(options?.onValidationFailed)) {
        if (typeof options!.onValidationFailed !== 'function') {
            throw new TypeError('options.onValidationFailed must be of type function');
        }
    }

    if (!isNil(options?.roles)) {
        if (!Array.isArray(options!.roles)) {
            throw new TypeError('options.roles must be of type Array');
        }
    }

    if (!isNil(options?.use)) {
        if (Array.isArray(options!.use)) {
            if (options!.use.some(mw => typeof mw !== 'function')) {
                throw new TypeError('All items of options.use must be of type function');
            }
        } else {
            throw new TypeError('options.use must be of type Array');
        }
    }

    if (!isNil(options?.validator)) {
        if (typeof options!.validator !== 'function') {
            throw new TypeError('options.validator must be of type function');
        }
    }

    return options;
}

function toAuthorizeRolesProviderSafe(value: Nilable<AuthorizeRolesValue>): AuthorizeRolesProvider {
    if (value) {
        let provider: Nilable<AuthorizeRolesProvider>;
        if (typeof value === 'function') {
            provider = value;
        } else if (Array.isArray(value)) {
            const roleNames = value.filter(rn => !!rn);
            if (roleNames.some(rn => typeof rn !== 'string')) {
                throw new TypeError('all role names must be of type string');
            }

            provider = () => roleNames;
        }

        if (typeof provider !== 'function') {
            throw new TypeError('value must be of type function or array');
        }

        return provider;
    } else {
        return () => [];
    }
}

function toAuthorizeValidatorSafe(validator: Nilable<AuthorizeValidator>): AuthorizeValidator {
    if (validator) {
        return validator;
    } else {
        return async ({ request, roles }) => {
            if (request.authorizedUser && roles.length) {
                // check if any role of authorizedUser
                // is part of 'roles'
                return request.authorizedUser.roles.some(ur => roles.includes(ur));
            }

            return false;
        };
    }
}

function toControllersAuthorizedUserProviderSafe(value: Nilable<AuthorizedUserProvider>): AuthorizedUserProvider {
    if (value) {
        return value;
    } else {
        return () => undefined;
    }
}

function toSetupAuthorizeMiddlewareHandlerSafe(handler: Nilable<SetupAuthorizeMiddlewareHandler>): SetupAuthorizeMiddlewareHandler {
    if (handler) {
        return handler;
    } else {
        // by default, add new at the end

        return ({ authorizeMiddlewares, middlewares }) => {
            middlewares.push(...authorizeMiddlewares);
        };
    }
}
