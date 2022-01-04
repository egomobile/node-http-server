import type { ServerResponse } from 'http';
import type { OpenAPIV3 } from 'openapi-types';
import type { Constructor, HttpPathValidator, HttpRequestHandler, IControllersOptions, IHttpController, IHttpServer } from '.';

export type GroupedHttpRequestHandlers = {
    [method: string]: RequestHandlerContext[];
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

export interface IInitControllerMethodActionContext {
    controller: IHttpController;
    controllerClass: Constructor<IHttpController>;
    fullFilePath: string;
    globalOptions: Nilable<IControllersOptions>;
    method: Function;
    relativeFilePath: string;
    server: IHttpServer;
}

export interface IInitControllerErrorHandlerActionContext {
    controller: IHttpController<IHttpServer>;
}

export interface IInitControllerSerializerActionContext {
    controller: IHttpController<IHttpServer>;
}

export interface IInitControllerMethodSwaggerActionContext {
    apiDocument: OpenAPIV3.Document;
    controller: IHttpController<IHttpServer>;
}

export interface IInitControllerValidationErrorHandlerActionContext {
    controller: IHttpController<IHttpServer>;
}

export interface IInitDocumentationUpdaterContext {
    controller: IHttpController<IHttpServer>;
}

export type InitControllerMethodAction = (context: IInitControllerMethodActionContext) => void;

export type InitControllerErrorHandlerAction = (context: IInitControllerErrorHandlerActionContext) => void;

export type InitControllerSerializerAction = (context: IInitControllerSerializerActionContext) => void;

export type InitControllerMethodSwaggerAction = (context: IInitControllerMethodSwaggerActionContext) => void;

export type InitControllerValidationErrorHandlerAction = (context: IInitControllerValidationErrorHandlerActionContext) => void;

export type InitDocumentationUpdaterAction = (context: IInitDocumentationUpdaterContext) => void;

export interface ISwaggerMethodInfo {
    doc: OpenAPIV3.PathItemObject;
    method: Function;
}

export type Nilable<T extends any = any> = Nullable<T> | Optional<T>;

export type Nullable<T extends any = any> = T | null;

export type Optional<T extends any = any> = T | undefined;

export interface RequestHandlerContext {
    end: (response: ServerResponse) => void;
    handler: HttpRequestHandler;
    isPathValid: HttpPathValidator;
}
