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

/**
 * Options for a `ControllerBase` based class.
 */
export interface IControllerOptions {
    /**
     * The full path of the file.
     */
    readonly file: string;
}

/**
 * A base controller.
 */
export abstract class ControllerBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {IControllerOptions} options The options.
     */
    public constructor(protected options: IControllerOptions) {
        //
    }
}