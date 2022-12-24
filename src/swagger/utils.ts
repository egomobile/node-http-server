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
import { normalizeRouterPath } from "../controllers/utils";
import type { HttpPathValidator } from "../types";
import type { Nilable } from "../types/internal";
import { isNil } from "../utils";

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
