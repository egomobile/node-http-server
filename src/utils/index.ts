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

import fs from "fs";
import path from "path";
import type { URLSearchParams } from "url";
import { middleware } from "..";
import { httpMethodsWithBodies } from "../constants";
import { EntityTooLargeError } from "../errors";
import type { HttpMiddleware, HttpRequestHandler, IHttpRequest, IHttpResponse, NextFunction, UniqueHttpMiddleware } from "../types";
import type { Constructor, Nilable, Nullable, ObjectNameListResolver, Optional } from "../types/internal";

interface ICreateWithEntityTooLargeActionOptions {
    action: HttpMiddleware;
    onLimitReached: HttpRequestHandler;
}

const propSepChar = String.fromCharCode(0);
const truthyValues = ["true", "1", "yes", "y"];

export function asAsync<TFunc extends Function = Function>(func: Function): TFunc {
    if (func.constructor.name === "AsyncFunction") {
        return func as TFunc;
    }

    return (async function (...args: any[]) {
        return func(...args);
    }) as any;
}

export function canHttpMethodHandleBodies(method: Nilable<string>): boolean {
    return httpMethodsWithBodies.includes(method as any);
}

export function compareValues<T>(x: T, y: T): number {
    return compareValuesBy(x, y, item => {
        return item;
    });
}

export function compareValuesBy<T1, T2>(x: T1, y: T1, selector: (item: T1) => T2): number {
    const valX = selector(x);
    const valY = selector(y);

    if (valX !== valY) {
        if (valX < valY) {
            return -1;
        }

        return 1;  // valX > valY
    }

    return 0;
}

export function createObjectNameListResolver(names: string[]): ObjectNameListResolver {
    if (names.some((n) => {
        return typeof n !== "string";
    })) {
        throw new TypeError("All names must be of type string");
    }

    if (names.length) {
        return () => {
            return names;
        };
    }
    else {
        return (obj) => {
            if (!isNil(obj)) {
                return Object.keys(obj);
            }
            else {
                return [];
            }
        };
    }
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
            }
            else {
                break;
            }
        }
    }

    return props;
}

export function getBufferEncoding(encoding: Nilable<BufferEncoding>): BufferEncoding {
    if (isNil(encoding)) {
        return "utf8";
    }

    if (typeof encoding === "string") {
        return encoding;
    }

    throw new TypeError("encoding must be of type string");
}

// s. https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
export function getFunctionParamNames(func: Function): string[] {
    let result: Nilable<string[]>;

    try {
        const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        const ARGUMENT_NAMES = /([^\s,]+)/g;

        const fnStr = func.toString().replace(STRIP_COMMENTS, "");
        result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
    }
    catch {
        result = undefined;
    }

    return result ?? [];
}

export function getProp(val: any, prop: string): any {
    // first replace escaped dots with temp char
    const escapedProp = prop.split("\\.").join(propSepChar);

    // now prepare path and replace temp char
    // in parts
    const propPath = escapedProp.split(".")
        .map(p => {
            return p.split(propSepChar).join(".");
        });

    let result = val;
    for (const p of propPath) {
        result = result[p];
    }

    return result;
}

export function getUrlWithoutQuery(url: Optional<string>): Optional<string> {
    if (!url) {
        return url;
    }

    const qMark = url.indexOf("?");
    if (qMark > -1) {
        url = url.substring(0, qMark);
    }

    return url;
}

export function isClass<T extends any = any>(maybeClass: any): maybeClass is Constructor<T> {
    return typeof maybeClass?.constructor === "function";
}

export function isNil(val: unknown): val is (undefined | null) {
    return typeof val === "undefined" || val === null;
}

export function isTruthy(val: unknown): boolean {
    return truthyValues.includes(
        String(val ?? "").toLowerCase().trim()
    );
}

export function limitToBytes(limit?: Nilable<number>): Nilable<number> {
    if (isNil(limit)) {
        return limit;
    }

    return limit * 1048576;
}

export function readStream(stream: NodeJS.ReadableStream) {
    const allChunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
        stream.once("error", reject);

        stream.on("data", (chunk: Buffer) => {
            try {
                allChunks.push(chunk);
            }
            catch (error) {
                reject(error);
            }
        });

        stream.once("end", () => {
            try {
                resolve(Buffer.concat(allChunks));
            }
            catch (error) {
                reject(error);
            }
        });
    });
}

export function readStreamWithLimit(
    stream: NodeJS.ReadableStream,
    limit: Nullable<number>
) {
    const allChunks: Buffer[] = [];
    let currentSize = 0;

    const addChunkAndRecalc = (chunk: Buffer) => {
        allChunks.push(chunk);

        currentSize += chunk.length;
    };

    let addChunk: (chunk: Buffer) => void;
    if (limit === null) {
        addChunk = (chunk) => {
            return addChunkAndRecalc(chunk);
        };
    }
    else {
        addChunk = (chunk) => {
            if (currentSize + chunk.length > limit!) {
                throw new EntityTooLargeError();
            }

            addChunkAndRecalc(chunk);
        };
    }

    return new Promise<Buffer>((resolve, reject) => {
        stream.once("error", reject);

        stream.on("data", (chunk: Buffer) => {
            try {
                addChunk(chunk);
            }
            catch (error) {
                reject(error);
            }
        });

        stream.once("end", () => {
            try {
                resolve(Buffer.concat(allChunks));
            }
            catch (error) {
                reject(error);
            }
        });
    });
}

export function sortObjectByKeys<T extends any = any>(obj: T): T {
    if (isNil(obj)) {
        return obj;
    }

    const sortedKeys = Object.keys(obj as any)
        .sort((x, y) => {
            return compareValuesBy(x, y, k => {
                return k.toLowerCase().trim();
            });
        });

    const newObj: any = {};
    sortedKeys.forEach(key => {
        newObj[key] = (obj as any)[key];
    });

    return newObj;
}

export function toUniqueHttpMiddleware(id: symbol, mw: HttpMiddleware): UniqueHttpMiddleware {
    const namedMiddleware = mw as UniqueHttpMiddleware;
    (namedMiddleware as any)[middleware] = id;

    return namedMiddleware;
}

export function urlSearchParamsToObject(params: Nilable<URLSearchParams>): Nilable<Record<string, string>> {
    if (!params) {
        return params as any;
    }

    const obj: Record<string, string> = {};

    params.forEach((value, key) => {
        obj[key] = value;
    });

    return obj;
}

export function walkDirSync(dir: string, action: (file: string, stats: fs.Stats) => void) {
    for (const item of fs.readdirSync(dir)) {
        if (item.trimStart().startsWith("_")) {
            continue;  // ignore items with beginning _
        }

        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            walkDirSync(fullPath, action);
        }
        else if (stats.isFile()) {
            action(fullPath, stats);
        }
    }
}

export function withEntityTooLarge(
    action: HttpMiddleware,
    onLimitReached: Nilable<HttpRequestHandler>
): HttpMiddleware {
    if (!onLimitReached) {
        onLimitReached = require("../middlewares").defaultLimitReachedHandler;
    }

    return createWithEntityTooLargeAction({
        action,
        "onLimitReached": onLimitReached!
    });
}

function createWithEntityTooLargeAction({ action, onLimitReached }: ICreateWithEntityTooLargeActionOptions) {
    return async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
        try {
            await action(request, response, next);
        }
        catch (error) {
            if (error instanceof EntityTooLargeError) {
                await onLimitReached(request, response);

                response.end();
            }
            else {
                throw error;
            }
        }
    };
}
