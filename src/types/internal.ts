import type { ServerResponse } from 'http';
import type { Constructor, HttpPathValidator, HttpRequestHandler, IHttpController, IHttpServer } from '.';

export type GroupedHttpRequestHandlers = {
    [method: string]: RequestHandlerContext[];
};

export interface IInitControllerMethodActionContext {
    controller: IHttpController;
    controllerClass: Constructor<IHttpController>;
    fullFilePath: string;
    method: Function;
    relativeFilePath: string;
    server: IHttpServer;
}

export type InitControllerMethodAction = (context: IInitControllerMethodActionContext) => void;

export interface RequestHandlerContext {
    end: (response: ServerResponse) => void;
    handler: HttpRequestHandler;
    isPathValid: HttpPathValidator;
}
