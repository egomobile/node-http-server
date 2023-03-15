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

import { defaultBodyLimit } from ".";
import type { Nilable, Nullable } from "../types/internal";

export function getBodyLimit(value: Nilable<number>): Nullable<number> {
    if (typeof value === "undefined") {
        return defaultBodyLimit;
    }

    if (typeof value === "number") {
        return value;
    }

    if (value === null) {
        return null;
    }

    throw new TypeError("value must be of type number or null");
}
