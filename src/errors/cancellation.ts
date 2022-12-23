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

import type { CancellationReason } from "..";

/**
 * Describes a cancellation error.
 */
export class CancellationError extends Error {
    /**
     * Initializes a new instance of that class.
     *
     * @param {CancellationReason} [reason] The known reason.
     * @param {string} [message] The custom message.
     * @param {any} [innerError] The inner error.
     */
    public constructor(
        public readonly reason?: CancellationReason,
        message?: string,
        public readonly innerError?: any
    ) {
        super(message);
    }
}
