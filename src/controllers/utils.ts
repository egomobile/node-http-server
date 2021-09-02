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

import path from 'path';
import { INIT_CONTROLLER_METHOD_ACTIONS } from '../constants';
import type { ControllerRouteOptionsValue, ControllerRouteWithBodyOptions, HttpMethod, HttpMiddleware, HttpRequestHandler, HttpRequestPath, Nilable } from '../types';
import type { InitControllerMethodAction } from '../types/internal';
import { asAsync, isNil } from '../utils';
import { params } from '../validators';

interface ICreateControllerMethodRequestHandlerOptions {
    method: Function;
}

export interface ICreateHttpMethodDecoratorOptions {
    decoratorOptions: Nilable<ControllerRouteOptionsValue<ControllerRouteWithBodyOptions>>;
    name: HttpMethod;
}

interface ICreateInitControllerMethodActionOptions {
    controllerMethod: string;
    controllerRouterPath: Nilable<string>;
    httpMethod: HttpMethod;
    middlewares: HttpMiddleware[];
}

function createControllerMethodRequestHandler({ method }: ICreateControllerMethodRequestHandlerOptions): HttpRequestHandler {
    method = asAsync<HttpRequestHandler>(method);

    return (request, response) => method(request, response);
}

export function createHttpMethodDecorator(options: ICreateHttpMethodDecoratorOptions): MethodDecorator {
    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        const decoratorOptions: Nilable<ControllerRouteWithBodyOptions> =
            typeof options.decoratorOptions === 'string' ? {
                path: options.decoratorOptions
            } : options.decoratorOptions;

        let initActions: Nilable<InitControllerMethodAction[]> = (method as any)[INIT_CONTROLLER_METHOD_ACTIONS];
        if (!initActions) {
            (method as any)[INIT_CONTROLLER_METHOD_ACTIONS] = initActions = [];
        }

        const middlewares = (
            Array.isArray(decoratorOptions?.use) ?
                decoratorOptions!.use :
                [decoratorOptions?.use]
        ).filter(mw => !isNil(mw)) as HttpMiddleware[];

        initActions.push(createInitControllerMethodAction({
            controllerMethod: String(methodName).trim(),
            controllerRouterPath: decoratorOptions?.path,
            httpMethod: options.name,
            middlewares
        }));
    };
}

function createInitControllerMethodAction({ controllerMethod, controllerRouterPath, httpMethod, middlewares }: ICreateInitControllerMethodActionOptions): InitControllerMethodAction {
    return ({ relativeFilePath, method, server }) => {
        const dir = path.dirname(relativeFilePath);
        const fileName = path.basename(relativeFilePath, path.extname(relativeFilePath));

        let routerPath: HttpRequestPath = dir;
        if (fileName !== 'index') {
            routerPath += `/${fileName}`;
        }

        if (controllerRouterPath?.length) {
            routerPath += normalizeRouterPath(controllerRouterPath);
        } else {
            if (controllerMethod.length && controllerMethod !== 'index') {
                routerPath += `/${controllerMethod}`;
            }
        }

        routerPath = normalizeRouterPath(routerPath);
        routerPath = routerPath.split('/@').join('/:');

        if (routerPath.includes('/:')) {
            routerPath = params(routerPath);
        }

        (server as any)[httpMethod](routerPath, middlewares, createControllerMethodRequestHandler({
            method
        }));
    };
}

export function getMethodOrThrow<T extends Function = Function>(descriptor: PropertyDescriptor): T {
    const method: any = descriptor?.value;
    if (typeof method !== 'function') {
        throw new TypeError('descriptor.value must be function');
    }

    return method;
}

export function normalizeRouterPath(p: Nilable<string>): string {
    if (!p?.length) {
        p = '';
    }

    p = p.split(path.sep)
        .map(x => x.trim())
        .filter(x => x !== '')
        .join('/')
        .trim();

    while (p.endsWith('/')) {
        p = p.substr(0, p.length - 1).trim();
    }
    while (p.startsWith('/')) {
        p = p.substr(1).trim();
    }

    if (!p.startsWith('/')) {
        p = '/' + p.trim();
    }

    return p;
}