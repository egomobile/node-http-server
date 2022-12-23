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

/**
 * Describes a timeout error.
 */
export class TimeoutError extends Error {
    /**
     * Initializes a new instance of that class.
     *
     * @param {number} maximumTime The maximum time in milliseconds for the operation.
     * @param {string} [message] The custom message.
     * @param {any} [innerError] The inner error.
     */
    public constructor(
        public readonly maximumTime: number,
        message?: string,
        public readonly innerError?: any
    ) {
        super(message);
    }
}
