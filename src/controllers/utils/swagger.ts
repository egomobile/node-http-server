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

import type { OpenAPIV3 } from "openapi-types";
import { getListFromObject } from ".";
import { JsonSchemaValidationFailedHandler, middleware } from "../..";
import { DOCUMENTATION_UPDATER, HTTP_METHODS, INIT_CONTROLLER_AUTHORIZE, INIT_CONTROLLER_METHOD_SWAGGER_ACTIONS, ROUTER_PATHS, SWAGGER_METHOD_INFO } from "../../constants";
import { validateMiddleware, validateQueryMiddleware, validateWithSwagger } from "../../middlewares";
import { toSwaggerPath } from "../../swagger/utils";
import type { ControllerRouteWithBodyOptions, DocumentationUpdaterHandler, HttpMethod, HttpMiddleware, IControllersOptions } from "../../types";
import type { GetterFunc, InitControllerMethodSwaggerAction, IRouterPathItem, ISwaggerMethodInfo, Nilable } from "../../types/internal";
import { asAsync, invokeMiddleware, isNil, sortObjectByKeys } from "../../utils";

interface ICreateInitControllerMethodSwaggerActionOptions {
    doc: OpenAPIV3.OperationObject;
    method: Function;
    methodName: string | symbol;
    middlewares: HttpMiddleware[];
};

export interface ISetupMiddlewaresBySwaggerDocumentationOptions {
    decoratorOptions: Nilable<ControllerRouteWithBodyOptions>;
    getOperationObjects: GetterFunc<OpenAPIV3.OperationObject[]>;
    globalOptions: Nilable<IControllersOptions>;
    middlewares: HttpMiddleware[];
    throwIfOptionsIncompatibleWithHTTPMethod: () => any;
}

export interface ISetupSwaggerDocumentationOptions {
    decoratorOptions: Nilable<ControllerRouteWithBodyOptions>;
    method: Function;
    methodName: string | symbol;
    middlewares: HttpMiddleware[];
}

interface IValidateWithDynamicSwaggerDocumentationOptions {
    getOperationObjects: GetterFunc<OpenAPIV3.OperationObject[]>;
    onValidationFailed: Nilable<JsonSchemaValidationFailedHandler>;
}

function createInitControllerMethodSwaggerAction({
    doc,
    method,
    middlewares
}: ICreateInitControllerMethodSwaggerActionOptions): InitControllerMethodSwaggerAction {
    return ({
        apiDocument,
        controller,
        controllerClass,
        resolveOperation
    }) => {
        const hasAuthorize = (controllerClass as any)[INIT_CONTROLLER_AUTHORIZE]?.length > 0;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const doesValidate = middlewares.some((mw) => {
            return (mw as any)[middleware] === validateMiddleware;
        });
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const doesValidateQuery = middlewares.some((mw) => {
            return (mw as any)[middleware] === validateQueryMiddleware;
        });

        const info: ISwaggerMethodInfo = {
            doc,
            method
        };

        (method as any)[SWAGGER_METHOD_INFO] = info;

        const allRouterPaths: Nilable<IRouterPathItem[]> = (method as any)[ROUTER_PATHS];
        if (allRouterPaths?.length) {
            const httpMethods: Nilable<HttpMethod[]> = (method as any)[HTTP_METHODS];

            let paths = apiDocument.paths!;

            allRouterPaths.forEach(({ httpMethod, routerPath }) => {
                const swaggerPath = toSwaggerPath(routerPath);

                httpMethods!.forEach(httpMethod => {
                    let pathObj: any = paths[swaggerPath];
                    if (!pathObj) {
                        pathObj = {};
                    }

                    let methodObj: any = pathObj[httpMethod];
                    if (methodObj) {
                        throw new Error(`Cannot reset documentation for route ${routerPath} (${httpMethod.toUpperCase()})`);
                    }

                    const docUpdater: Nilable<DocumentationUpdaterHandler> = (controller as any)[DOCUMENTATION_UPDATER];
                    if (docUpdater) {
                        docUpdater({
                            "documentation": doc,
                            "method": httpMethod.toUpperCase() as Uppercase<HttpMethod>,
                            "path": routerPath,

                            doesValidate,
                            doesValidateQuery,
                            hasAuthorize,
                            middlewares
                        });
                    }

                    pathObj[httpMethod] = doc;
                    resolveOperation({
                        "operation": doc
                    });

                    paths[swaggerPath] = sortObjectByKeys(pathObj);
                });
            });

            apiDocument.paths = sortObjectByKeys(paths);
        }
    };
}

export function setupMiddlewaresBySwaggerDocumentation({
    decoratorOptions,
    getOperationObjects,
    globalOptions,
    middlewares,
    throwIfOptionsIncompatibleWithHTTPMethod
}: ISetupMiddlewaresBySwaggerDocumentationOptions) {
    const documentation = decoratorOptions?.documentation;

    let shouldValidateWithDocumentation = false;
    if (isNil(decoratorOptions?.validateWithDocumentation)) {
        // use global value
        shouldValidateWithDocumentation = isNil(globalOptions?.validateWithDocumentation) ? true : !!globalOptions?.validateWithDocumentation;
    }
    else {
        // explicitly defined in decorator
        shouldValidateWithDocumentation = !!decoratorOptions?.validateWithDocumentation;
    }

    if (!shouldValidateWithDocumentation) {
        return;
    }

    if ((documentation?.requestBody as OpenAPIV3.RequestBodyObject)?.required) {
        throwIfOptionsIncompatibleWithHTTPMethod();
    }

    const onValidationFailed = decoratorOptions?.onValidationWithDocumentationFailed ||
        globalOptions?.onValidationWithDocumentationFailed;

    // first add 'validateWithSwagger()' middleware
    middlewares.push(
        validateWithDynamicSwaggerDocumentation({
            getOperationObjects,
            onValidationFailed
        })
    );
}

export function setupSwaggerDocumentation({
    decoratorOptions,
    method,
    methodName,
    middlewares
}: ISetupSwaggerDocumentationOptions) {
    if (!decoratorOptions?.documentation) {
        return;
    }

    getListFromObject<InitControllerMethodSwaggerAction>(method, INIT_CONTROLLER_METHOD_SWAGGER_ACTIONS).push(
        createInitControllerMethodSwaggerAction({
            "doc": JSON.parse(
                JSON.stringify(decoratorOptions.documentation)
            ),
            method,
            methodName,
            middlewares
        })
    );
}

function validateWithDynamicSwaggerDocumentation({
    getOperationObjects,
    onValidationFailed
}: IValidateWithDynamicSwaggerDocumentationOptions): HttpMiddleware {
    return async (request, response, next) => {
        const allDocumentations = getOperationObjects();

        let index = -1;
        const validateNextDocumentation = () => {
            const documentation = allDocumentations[++index];

            if (documentation) {
                invokeMiddleware({
                    "middleware": asAsync<HttpMiddleware>(
                        validateWithSwagger({
                            documentation,
                            onValidationFailed
                        })
                    ),
                    "next": validateNextDocumentation,
                    "nextOnError": next,
                    request,
                    response
                });
            }
            else {
                // we are finished here
                next();
            }
        };

        // begin
        validateNextDocumentation();
    };
}