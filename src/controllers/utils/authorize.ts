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

import { compileExpression } from "filtrex";
import { AuthorizeError } from "../../errors";
import type { AuthorizeArgumentValue, AuthorizedUserProvider, AuthorizeRolesProvider, AuthorizeRolesValue, AuthorizeValidationFailedHandler, AuthorizeValidator, AuthorizeValidatorValue, HttpMiddleware, IAuthorizeOptions, IAuthorizeValidatorContext, SetupAuthorizeMiddlewareHandler } from "../../types";
import type { InitControllerAuthorizeAction, Nilable } from "../../types/internal";
import { asAsync, getProp, isNil } from "../../utils";

interface ICreateAuthorizeMiddlewareFromOptionsOptions {
    findAuthorizedUser: AuthorizedUserProvider;
    onValidationFailed: Nilable<AuthorizeValidationFailedHandler>;
    rolesProvider: AuthorizeRolesProvider;
    validator: AuthorizeValidator;
}

export interface ICreateInitControllerAuthorizeActionOptions {
    arg: Nilable<AuthorizeArgumentValue>;
}

export function createAuthorizeValidatorFromExpression(expression: string): AuthorizeValidator {
    return async ({ request, roles }) => {
        if (request.authorizedUser) {
            // we have an authorized user here

            const filter = compileExpression(expression, {
                "extraFunctions": {
                    "getProp": (value: any, propPath: string) => {
                        return getProp(value, propPath);
                    },
                    "hasHeader": (name: string, value: any) => {
                        return request.headers[name] === value;
                    },
                    "hasRole": (r: any) => {
                        return !!request.authorizedUser?.roles.includes(r);
                    },
                    "log": (value: any, returnValue = true) => {
                        console.log(value);
                        return returnValue;
                    },
                    "str": (value: any) => {
                        return String(value);
                    },
                    "trace": (value: any, returnValue = true) => {
                        console.trace(value);
                        return returnValue;
                    }
                }
            });

            return !!filter({
                request,
                roles,
                "user": request.authorizedUser
            });
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
                    "Content-Length": "0"
                });
            }
        };
    }

    findAuthorizedUser = asAsync<AuthorizedUserProvider>(findAuthorizedUser);
    onValidationFailed = asAsync<AuthorizeValidationFailedHandler>(onValidationFailed);
    rolesProvider = asAsync<AuthorizeRolesProvider>(rolesProvider);
    validator = asAsync<AuthorizeValidator>(validator);

    return async (request, response, next) => {
        let reason: AuthorizeError = new AuthorizeError("Validation failed");

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
                    "roles": authorizedUser.roles
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
        }
        catch (error: any) {
            reason = new AuthorizeError(String(error?.message || ""), error);
        }

        await onValidationFailed!(reason, request, response);

        response.end();
    };
}

export function createInitControllerAuthorizeAction({ arg }: ICreateInitControllerAuthorizeActionOptions): InitControllerAuthorizeAction {
    const options = toAuthorizeOptions(arg);

    return ({ globalOptions, middlewares }) => {
        if (!options) {
            return;  // nothing to do here
        }

        // prepare and normalize functions and handlers
        const onValidationFailed = options.onValidationFailed || globalOptions?.authorize?.onValidationFailed;
        const setupAuthorizeMiddleware = toSetupAuthorizeMiddlewareHandlerSafe(
            options.setupMiddleware || globalOptions?.authorize?.setupMiddleware
        );
        const findAuthorizedUser = toControllersAuthorizedUserProviderSafe(
            options.findAuthorizedUser || globalOptions?.authorize?.findAuthorizedUser
        );
        const rolesProvider = toAuthorizeRolesProviderSafe(options.roles);
        const validator = toAuthorizeValidatorSafe(options.validator || globalOptions?.authorize?.validator);
        const use = (options.use || globalOptions?.authorize?.use)
            ?.filter(mw => {
                return !!mw;
            });

        const authorizeMiddlewares = [
            createAuthorizeMiddlewareFromOptions({
                findAuthorizedUser,
                onValidationFailed,
                rolesProvider,
                validator
            })
        ];

        if (use?.length) {
            if (use.some(mw => {
                return typeof mw !== "function";
            })) {
                throw new TypeError("All middlewares must be of type function");
            }

            authorizeMiddlewares.unshift(...use);
        }

        setupAuthorizeMiddleware({
            authorizeMiddlewares,
            middlewares
        });
    };
}

function toAuthorizeOptions(arg1: Nilable<AuthorizeArgumentValue>): Nilable<IAuthorizeOptions> {
    let options: Nilable<IAuthorizeOptions>;
    if (arg1) {
        if (typeof arg1 === "string") {
            // arg1 => validatorExpression
            options = {
                "validator": createAuthorizeValidatorFromExpression(arg1)
            };
        }
        else if (typeof arg1 === "function") {
            // arg1 => AuthorizeValidator
            options = {
                "validator": arg1
            };
        }
        else if (Array.isArray(arg1)) {
            // arg1 => AuthorizeRoles
            options = {
                "roles": arg1
            };
        }
        else {
            // arg1 => options
            options = arg1;
        }
    }

    if (!isNil(options?.onValidationFailed)) {
        if (typeof options!.onValidationFailed !== "function") {
            throw new TypeError("options.onValidationFailed must be of type function");
        }
    }

    if (!isNil(options?.roles)) {
        if (!Array.isArray(options!.roles)) {
            throw new TypeError("options.roles must be of type Array");
        }
    }

    if (!isNil(options?.use)) {
        if (Array.isArray(options!.use)) {
            if (options!.use.some(mw => {
                return typeof mw !== "function";
            })) {
                throw new TypeError("All items of options.use must be of type function");
            }
        }
        else {
            throw new TypeError("options.use must be of type Array");
        }
    }

    if (!isNil(options?.validator)) {
        if (typeof options!.validator !== "function" && typeof options!.validator !== "string") {
            throw new TypeError("options.validator must be of type function or string");
        }
    }

    return options;
}

function toAuthorizeRolesProviderSafe(value: Nilable<AuthorizeRolesValue>): AuthorizeRolesProvider {
    if (value) {
        let provider: Nilable<AuthorizeRolesProvider>;
        if (typeof value === "function") {
            provider = value;
        }
        else if (Array.isArray(value)) {
            const roleNames = value.filter(rn => {
                return !!rn;
            });
            if (roleNames.some(rn => {
                return typeof rn !== "string";
            })) {
                throw new TypeError("all role names must be of type string");
            }

            provider = () => {
                return roleNames;
            };
        }

        if (typeof provider !== "function") {
            throw new TypeError("value must be of type function or array");
        }

        return provider;
    }
    else {
        return () => {
            return [];
        };
    }
}

function toAuthorizeValidatorSafe(validator: Nilable<AuthorizeValidatorValue>): AuthorizeValidator {
    if (validator) {
        if (typeof validator === "function") {
            return validator;
        }
        else if (typeof validator === "string") {
            return createAuthorizeValidatorFromExpression(validator);
        }
        else {
            throw new TypeError("validator must be of type function or string");
        }
    }
    else {
        return async ({ request, roles }) => {
            if (request.authorizedUser && roles.length) {
                // check if any role of authorizedUser
                // is part of 'roles'
                return request.authorizedUser.roles.some(ur => {
                    return roles.includes(ur);
                });
            }

            return false;
        };
    }
}

function toControllersAuthorizedUserProviderSafe(value: Nilable<AuthorizedUserProvider>): AuthorizedUserProvider {
    if (value) {
        return value;
    }
    else {
        return () => {
            return undefined;
        };
    }
}

function toSetupAuthorizeMiddlewareHandlerSafe(handler: Nilable<SetupAuthorizeMiddlewareHandler>): SetupAuthorizeMiddlewareHandler {
    if (handler) {
        return handler;
    }
    else {
        // by default, add new at the end

        return ({ authorizeMiddlewares, middlewares }) => {
            middlewares.push(...authorizeMiddlewares);
        };
    }
}
