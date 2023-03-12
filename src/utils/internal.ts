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

import type { Nilable } from "../types/internal.js";

export function asAsync<TFunc extends Function = Function>(func: Function): TFunc {
    if (func.constructor.name === "AsyncFunction") {
        return func as TFunc;
    }

    return (async function (...args: any[]) {
        return func(...args);
    }) as unknown as TFunc;
}

export function getUrlWithoutQuery(url: Nilable<string>): string {
    if (!url) {
        return "";
    }

    const qMark = url.indexOf("?");
    if (qMark > -1) {
        url = url.substring(0, qMark);
    }

    return url;
}

export function isDev(): boolean {
    return process.env.NODE_ENV?.toLowerCase().trim() === "development";
}

export function isNil(value: unknown): value is (undefined | null) {
    return typeof value === "undefined" ||
        value === null;
}
