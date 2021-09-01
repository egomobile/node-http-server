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

import fs from 'fs';
import path from 'path';
import { EntityTooLargeError } from './errors';
import type { Constructor, HttpMiddleware, HttpRequestHandler, IHttpRequest, IHttpResponse, NextFunction, Nilable, Optional } from './types';

interface ICreateWithEntityTooLargeActionOptions {
    action: HttpMiddleware;
    onLimitReached: HttpRequestHandler;
}

export function asAsync<TFunc extends Function = Function>(func: Function): TFunc {
    if (func.constructor.name === 'AsyncFunction') {
        return func as TFunc;
    }

    return (async function (...args: any[]) {
        return func(...args);
    }) as any;
}

export function getAllClassProps(startClass: any): string[] {
    const props: string[] = [];

    if (startClass instanceof Function) {
        let currentClass = startClass;

        while (currentClass) {
            if (currentClass.prototype) {
                for (const propName of Object.getOwnPropertyNames(currentClass.prototype)) {
                    if (!props.includes(propName)) {
                        props.unshift(propName);
                    }
                }
            }

            const parentClass = Object.getPrototypeOf(currentClass);

            if (parentClass && parentClass !== Object && parentClass.name) {
                currentClass = parentClass;
            } else {
                break;
            }
        }
    }

    return props;
}

export function getUrlWithoutQuery(url: Optional<string>): Optional<string> {
    if (!url) {
        return url;
    }

    const qMark = url.indexOf('?');
    if (qMark > -1) {
        url = url.substr(0, qMark);
    }

    return url;
}

export function isClass<T extends any = any>(maybeClass: any): maybeClass is Constructor<T> {
    return typeof maybeClass?.constructor === 'function';
}

export function isNil(val: unknown): val is (null | undefined) {
    return val === null ||
        typeof val === 'undefined';
}

export function readStream(stream: NodeJS.ReadableStream) {
    const allChunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
        stream.once('error', reject);

        stream.on('data', (chunk: Buffer) => {
            try {
                allChunks.push(chunk);
            } catch (error) {
                reject(error);
            }
        });

        stream.once('end', () => {
            try {
                resolve(Buffer.concat(allChunks));
            } catch (error) {
                reject(error);
            }
        });
    });
}

export function readStreamWithLimit(
    stream: NodeJS.ReadableStream,
    limit: Nilable<number>
) {
    const allChunks: Buffer[] = [];
    let currentSize = 0;

    const addChunkAndRecalc = (chunk: Buffer) => {
        allChunks.push(chunk);

        currentSize = allChunks.reduce(
            (currentSum, currentChunk) => currentSum + currentChunk.length,
            0
        );
    };

    let addChunk: (chunk: Buffer) => void;
    if (limit === null) {
        addChunk = (chunk) => addChunkAndRecalc(chunk);
    } else {
        addChunk = (chunk) => {
            if (currentSize + chunk.length > limit!) {
                throw new EntityTooLargeError();
            }

            addChunkAndRecalc(chunk);
        };
    }

    return new Promise<Buffer>((resolve, reject) => {
        stream.once('error', reject);

        stream.on('data', (chunk: Buffer) => {
            try {
                addChunk(chunk);
            } catch (error) {
                reject(error);
            }
        });

        stream.once('end', () => {
            try {
                resolve(Buffer.concat(allChunks));
            } catch (error) {
                reject(error);
            }
        });
    });
};

export function walkDirSync(dir: string, action: (file: string, stats: fs.Stats) => void) {
    for (const item of fs.readdirSync(dir)) {
        if (item.trimStart().startsWith('_')) {
            continue;  // ignore items with beginning _
        }

        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            walkDirSync(fullPath, action);
        } else if (stats.isFile()) {
            action(fullPath, stats);
        }
    }
}

export function withEntityTooLarge(
    action: HttpMiddleware,
    onLimitReached: Nilable<HttpRequestHandler>
): HttpMiddleware {
    if (!onLimitReached) {
        onLimitReached = require('./middlewares').defaultLimitReachedHandler;
    }

    return createWithEntityTooLargeAction({
        action,
        onLimitReached: onLimitReached!
    });
}

function createWithEntityTooLargeAction({ action, onLimitReached }: ICreateWithEntityTooLargeActionOptions) {
    return async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
        try {
            await action(request, response, next);
        } catch (error) {
            if (error instanceof EntityTooLargeError) {
                await onLimitReached(request, response);
            } else {
                throw error;
            }
        }
    };
}
