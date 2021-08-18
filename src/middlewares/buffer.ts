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

import { HttpMiddleware } from '../types';
import { readStream } from '../utils';

/**
 * Creates a middleware, that reads the while input of the request stream,
 * and writes it to 'body' property of the request context as buffer.
 *
 * @returns {HttpMiddleware} The new middleware.
 */
export function buffer(): HttpMiddleware {
    return async (request, response, next) => {
        request.body = await readStream(request);

        next();
    };
}
