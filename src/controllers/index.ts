/* eslint-disable no-underscore-dangle */

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

import type { IHttpController, IHttpControllerOptions, IHttpServer } from "../types";

/**
 * A basic controller.
 */
export abstract class ControllerBase<TApp extends any = IHttpServer> implements IHttpController<TApp> {
    /**
     * Initializes a new instance of that class.
     *
     * @param {IHttpControllerOptions<TApp>} options The options.
     */
    public constructor(options: IHttpControllerOptions<TApp>) {
        this.__app = options.app;
        this.__file = options.file;
        this.__path = options.path;
    }

    /**
     * @inheritdoc
     */
    public readonly __app: TApp;
    /**
     * @inheritdoc
     */
    public readonly __file: string;
    /**
     * @inheritdoc
     */
    public readonly __path: string;
}

export * from "./Authorize";
export * from "./CONNECT";
export * from "./Controller";
export * from "./DELETE";
export * from "./DocumentationUpdater";
export * from "./ErrorHandler";
export * from "./GET";
export * from "./HEAD";
export * from "./Headers";
export * from "./Import";
export * from "./OPTIONS";
export * from "./Parameter";
export * from "./PATCH";
export * from "./POST";
export * from "./PUT";
export * from "./Query";
export * from "./Request";
export * from "./Response";
export * from "./Serializer";
export * from "./TRACE";
export * from "./Use";
export * from "./ValidationErrorHandler";

