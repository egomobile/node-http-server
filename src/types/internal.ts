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

import type { HttpMiddleware, HttpPathValidator, HttpRequestHandler } from "./index.js";

export type RequestHandlerContextEndMethod<TResponse> =
    (response: TResponse) => Promise<void>;

export interface IHttpRequestHandlerContext<TRequest, TResponse> {
    readonly end: RequestHandlerContextEndMethod<TResponse>;
    readonly baseHandler: HttpRequestHandler<TRequest, TResponse>;
    handler: HttpRequestHandler<TRequest, TResponse>;
    readonly isPathValid: HttpPathValidator<TRequest>;
    readonly middlewares: HttpMiddleware<TRequest, TResponse>[];
}

export type Optional<T extends any = any> = T | undefined;

export type Nilable<T extends any = any> = Optional<T> | Nullable<T>;

export type Nullable<T extends any = any> = T | null;
