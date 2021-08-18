import type { HttpPathValidator, HttpRequestHandler } from '.';

export type GroupedHttpRequestHandlers = {
    [method: string]: RequestHandlerContext[];
};

export interface RequestHandlerContext {
    handler: HttpRequestHandler;
    isPathValid: HttpPathValidator;
}
