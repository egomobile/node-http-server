import type { ServerResponse } from 'http';
import type { HttpPathValidator, HttpRequestHandler } from '.';

export type GroupedHttpRequestHandlers = {
    [method: string]: RequestHandlerContext[];
};

export interface RequestHandlerContext {
    end: (response: ServerResponse) => void;
    handler: HttpRequestHandler;
    isPathValid: HttpPathValidator;
}
