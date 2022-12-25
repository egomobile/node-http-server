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

import type { ServerResponse } from "http";
import type { OpenAPIV3 } from "openapi-types";
import type { HttpMethod, HttpMiddleware, HttpPathValidator, HttpRequestHandler, IControllerMethodInfo, IControllersOptions, IHttpController, IHttpServer, ImportValues, ITestSettings, ITestSettingValueGetterContext, ParameterOptions } from ".";

export type Constructor<T extends any = any> = (new (...args: any[]) => T);

export type Func = (...args: any[]) => any;

export type GetterFunc<TValue extends any = any> = () => TValue;

export type GroupedHttpRequestHandlers = {
    [method: string]: IRequestHandlerContext[];
};

export interface IControllerClass {
    class: Constructor<IHttpController>;
    file: IControllerFile;
}

export interface IControllerContext {
    controllers: IControllerInfo[];
    isSwaggerUIEnabled: boolean;
    swagger: OpenAPIV3.Document;
}

export interface IControllerFile {
    fullPath: string;
    relativePath: string;
}

export interface IControllerInfo {
    controller: IHttpController;
    controllerClass: IControllerClass;
}

export interface IControllerMethodParameter {
    index: number;
    method: Function;
    name: string;
    options: ParameterOptions;
}

export interface IInitControllerAuthorizeActionContext {
    globalOptions: Nilable<IControllersOptions>;
    middlewares: HttpMiddleware[];
}

export interface IInitControllerMethodActionContext {
    controller: IHttpController;
    controllerClass: Constructor<IHttpController>;
    fullFilePath: string;
    globalOptions: Nilable<IControllersOptions>;
    method: Function;
    relativeFilePath: string;
    resolveInfo: ResolveControllerMethodInfo;
    server: IHttpServer;
}

export interface IInitControllerMethodParametersActionContext {
}

export interface IInitControllerErrorHandlerActionContext {
    controller: IHttpController<IHttpServer>;
}

export interface IInitControllerImportActionContext {
    controller: IHttpController<IHttpServer>;
    imports: ImportValues;
}

export interface IInitControllerSerializerActionContext {
    controller: IHttpController<IHttpServer>;
}

export interface IInitControllerMethodSwaggerActionContext {
    apiDocument: OpenAPIV3.Document;
    controller: IHttpController<IHttpServer>;
    controllerClass: Constructor<IHttpController>;
    resolveOperation: (operation: OpenAPIV3.OperationObject) => any;
}

export interface IInitControllerParseErrorHandlerActionContext {
    controller: IHttpController<IHttpServer>;
}

export interface IInitControllerMethodTestActionContext {
    controller: IHttpController<IHttpServer>;
    index: number;
    server: IHttpServer;
    shouldAllowEmptySettings: boolean;
    shouldUseModuleAsDefault: boolean;
    timeout: number;
}

export interface IInitControllerValidationErrorHandlerActionContext {
    controller: IHttpController<IHttpServer>;
}

export interface IInitDocumentationUpdaterContext {
    controller: IHttpController<IHttpServer>;
}

export type InitControllerAuthorizeAction = (context: IInitControllerAuthorizeActionContext) => void;

export type InitControllerMethodAction = (context: IInitControllerMethodActionContext) => void;

export type InitControllerMethodParametersAction = (context: IInitControllerMethodParametersActionContext) => void;

export type InitControllerErrorHandlerAction = (context: IInitControllerErrorHandlerActionContext) => void;

export type InitControllerImportAction = (context: IInitControllerImportActionContext) => void;

export type InitControllerSerializerAction = (context: IInitControllerSerializerActionContext) => void;

export type InitControllerMethodSwaggerAction = (context: IInitControllerMethodSwaggerActionContext) => void;

export type InitControllerMethodTestAction = (context: IInitControllerMethodTestActionContext) => void;

export type InitControllerParseErrorHandlerAction = (context: IInitControllerParseErrorHandlerActionContext) => void;

export type InitControllerValidationErrorHandlerAction = (context: IInitControllerValidationErrorHandlerActionContext) => void;

export type InitDocumentationUpdaterAction = (context: IInitDocumentationUpdaterContext) => void;

export interface IPrepareControllerMethodActionContext {
    controller: IHttpController;
    controllerClass: Constructor<IHttpController>;
    fullFilePath: string;
    globalOptions: Nilable<IControllersOptions>;
    method: Function;
    relativeFilePath: string;
    server: IHttpServer;
}

export interface IRequestHandlerContext {
    end: (response: ServerResponse) => void;
    handler: HttpRequestHandler;
    isPathValid: HttpPathValidator;
    middlewares?: Nilable<HttpMiddleware[]>;
}

export interface IRouterPathItem {
    httpMethod: HttpMethod;
    routerPath: string;
}

export interface ISwaggerMethodInfo {
    doc: OpenAPIV3.PathItemObject;
    method: Function;
}

export interface ITestDescription {
    name: string;
}

export interface ITestOptions {
    controller: IHttpController;
    getBody: (context: ITestSettingValueGetterContext) => Promise<any>;
    getExpectedBody: (context: ITestSettingValueGetterContext) => Promise<any>;
    getExpectedHeaders: (context: ITestSettingValueGetterContext) => Promise<Record<string, string | RegExp>>;
    getExpectedStatus: (context: ITestSettingValueGetterContext) => Promise<number>;
    getHeaders: (context: ITestSettingValueGetterContext) => Promise<Record<string, any>>;
    getParameters: (context: ITestSettingValueGetterContext) => Promise<Record<string, string>>;
    getTimeout: (context: ITestSettingValueGetterContext) => Promise<number>;
    index: number;
    method: Function;
    methodName: string | symbol;
    name: string;
    settings: ITestSettings;
}

export type List<T extends any = any> = T[] | Iterable<T> | IterableIterator<T>;

export type ObjectNameListResolver = (obj: any) => string[];

export type PrepareControllerMethodAction = (context: IPrepareControllerMethodActionContext) => void;

export type Nilable<T extends any = any> = Nullable<T> | Optional<T>;

export type Nullable<T extends any = any> = T | null;

export type ObjectKey = string | symbol;

export type Optional<T extends any = any> = T | undefined;

// s. https://stackoverflow.com/questions/43159887/make-a-single-property-optional-in-typescript
export type PartialBy<T, TKey extends keyof T> = Omit<T, TKey> & Partial<Pick<T, TKey>>;

export type ResolveControllerMethodInfo = (info: IControllerMethodInfo) => any;

export type TestOptionsGetter = () => Promise<ITestOptions>;
