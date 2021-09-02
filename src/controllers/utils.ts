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

import path from 'path';
import type { Nilable } from '../types';

export function getListFromObject<T extends any = any>(obj: any, key: PropertyKey): T[] {
    let list: Nilable<T[]> = obj[key];

    if (!list) {
        obj[key] = list = [];
    }

    return list;
}

export function getMethodOrThrow<T extends Function = Function>(descriptor: PropertyDescriptor): T {
    const method: any = descriptor?.value;
    if (typeof method !== 'function') {
        throw new TypeError('descriptor.value must be function');
    }

    return method;
}

export function normalizeRouterPath(p: Nilable<string>): string {
    if (!p?.length) {
        p = '';
    }

    p = p.split(path.sep)
        .map(x => x.trim())
        .filter(x => x !== '')
        .join('/')
        .trim();

    while (p.endsWith('/')) {
        p = p.substr(0, p.length - 1).trim();
    }
    while (p.startsWith('/')) {
        p = p.substr(1).trim();
    }

    if (!p.startsWith('/')) {
        p = '/' + p.trim();
    }

    return p;
}