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
import path from "path";
import { normalizeRouterPath } from "../controllers/utils";
import type { HttpMethod, HttpPathValidator } from "../types";
import type { IControllerClass, Nilable } from "../types/internal";
import { isNil, toKebabCase } from "../utils";

export interface IParseSwaggerOperationIdTemplateOptions {
    controllerClass: IControllerClass;
    httpMethod: HttpMethod;
    methodName: string;
    template: string;
}

export function createSwaggerPathValidator(basePath: Nilable<string>): HttpPathValidator {
    basePath = getSwaggerDocsBasePath(basePath);
    const basePathWithSuffix = basePath + (basePath.endsWith("/") ? "" : "/");

    return (request) => {
        return request.url === basePath ||
            !!request.url?.startsWith(basePathWithSuffix);
    };
}

export function getSwaggerDocsBasePath(basePath: Nilable<string>): string {
    if (isNil(basePath)) {
        basePath = "";
    }

    basePath = basePath.trim();

    if (basePath === "") {
        return "/swagger";
    }

    return normalizeRouterPath(basePath);
}

export function parseSwaggerOperationIdTemplate(options: IParseSwaggerOperationIdTemplateOptions): string {
    const {
        controllerClass,
        httpMethod,
        methodName,
        template
    } = options;

    const {
        "relativePath": controllerFilePath
    } = controllerClass.file;

    return template.replaceAll(/(\{\{)([a-z|\-]+)(\:?)([^\}]*)(\}\})/gi, (
        str: string,
        openBracket: string, name: string, sep1: string, formatterList: string, closeBracket: string
    ) => {
        const nameLower = name.toLowerCase().trim();

        let shouldUseFormatters = true;

        // detect base value first
        let result = str;
        if (nameLower === "class") {
            result = controllerClass["class"].name;
        }
        else if (nameLower === "method") {
            result = methodName;
        }
        else if (nameLower === "http-method") {
            result = httpMethod;
        }
        else if (nameLower === "file") {
            result = path.basename(controllerFilePath, path.extname(controllerFilePath));
        }
        else if (nameLower === "path") {
            result = controllerFilePath;
        }
        else {
            // is not support, so it makes no sense to
            // use formatters
            shouldUseFormatters = false;
        }

        if (shouldUseFormatters) {
            const allFormatters = formatterList.split(",").map((formatter) => {
                return formatter.trim();
            }).filter((formatter) => {
                return formatter !== "";
            });

            for (let i = 0; i < allFormatters.length; i++) {
                const format = allFormatters[i];
                const formatLower = format.toLowerCase();

                if (formatLower === "upper") {
                    result = result.toUpperCase();
                }
                else if (formatLower === "lower") {
                    result = result.toLowerCase();
                }
                else if (formatLower === "trim") {
                    result = result.trim();
                }
                else if (formatLower === "kebap") {
                    result = toKebabCase(result);
                }
                else {
                    if (["path"].includes(nameLower)) {
                        const index = parseInt(formatLower);
                        if (!Number.isNaN(index)) {
                            result = controllerFilePath.split("/")[index] ?? result;
                        }
                    }
                }
            }
        }

        return result;
    });
}

export function toSwaggerPath(routePath: string): string {
    return normalizeRouterPath(
        normalizeRouterPath(routePath)
            .split("/")
            .map(x => {
                return x.trimStart().startsWith(":") ? `{${x.substring(1)}}` : x;
            })
            .join("/")
    );
}

export function toOperationObject(val: unknown): Nilable<OpenAPIV3.OperationObject> {
    if (typeof val === "function") {
        return val();
    }

    if (typeof val === "object" || isNil(val)) {
        return val as Nilable<OpenAPIV3.OperationObject>;
    }

    throw new TypeError("val must be of type function or object");
}
