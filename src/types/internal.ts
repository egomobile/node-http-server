import type { ServerResponse } from "http";
import type { OpenAPIV3 } from "openapi-types";
import type { HttpMiddleware, HttpPathValidator, HttpRequestHandler, IControllerMethodInfo, IControllersOptions, IHttpController, IHttpServer, ImportValues, ParameterOptions } from ".";

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
    swagger?: Optional<OpenAPIV3.Document>;
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
}

export interface IInitControllerParseErrorHandlerActionContext {
    controller: IHttpController<IHttpServer>;
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

export interface ISwaggerMethodInfo {
    doc: OpenAPIV3.PathItemObject;
    method: Function;
}

export type ObjectNameListResolver = (obj: any) => string[];

export type PrepareControllerMethodAction = (context: IPrepareControllerMethodActionContext) => void;

export type Nilable<T extends any = any> = Nullable<T> | Optional<T>;

export type Nullable<T extends any = any> = T | null;

export type ObjectKey = string | symbol;

export type Optional<T extends any = any> = T | undefined;

// s. https://stackoverflow.com/questions/43159887/make-a-single-property-optional-in-typescript
export type PartialBy<T, TKey extends keyof T> = Omit<T, TKey> & Partial<Pick<T, TKey>>;

export type ResolveControllerMethodInfo = (info: IControllerMethodInfo) => any;
