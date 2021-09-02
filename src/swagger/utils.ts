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

import { normalizeRouterPath } from '../controllers/utils';
import type { HttpPathValidator, Nilable } from '../types';
import { isNil } from '../utils';

export function createSwaggerPathValidator(basePath: Nilable<string>): HttpPathValidator {
    basePath = getSwaggerDocsBasePath(basePath);
    const basePathWithSuffix = basePath + (basePath.endsWith('/') ? '' : '/');

    return (request) => request.url === basePath ||
        !!request.url?.startsWith(basePathWithSuffix);
}

export function getSwaggerDocsBasePath(basePath: Nilable<string>): string {
    if (isNil(basePath)) {
        basePath = '';
    }

    if (typeof basePath !== 'string') {
        throw new TypeError('basePath must be of type string');
    }

    basePath = basePath.trim();
    if (basePath === '') {
        return '/_docs';
    }

    return normalizeRouterPath(basePath);
}

export function toSwaggerPath(routePath: string): string {
    return normalizeRouterPath(
        normalizeRouterPath(routePath)
            .split('/')
            .map(x => x.trimStart().startsWith(':') ? `{${x.substr(1)}}` : x)
            .join('/')
    );
}
