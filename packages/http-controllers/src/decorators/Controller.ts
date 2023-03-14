/* eslint-disable @typescript-eslint/naming-convention */

// This file is part of the @egomobile/http-controllers distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-controllers is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-controllers is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { IS_CONTROLLER_CLASS } from "../constants/internal.js";
import { isClass } from "../utils/internal.js";

export function Controller(): ClassDecorator {
    return function (classFunction: Function) {
        if (!isClass(classFunction)) {
            throw new TypeError("classFunction must be of type class");
        }

        (classFunction as any)[IS_CONTROLLER_CLASS] = true;
    };
}
