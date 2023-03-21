// This file is part of the @egomobile/http-controllers distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-controllers is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-controllers is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { moduleMode } from "@egomobile/http-server";
import path from "node:path";
import { EntityTooLargeError } from "../errors/entityTooLarge.js";
import type { Constructor, Nilable, Nullable } from "../types/internal.js";

interface IGetListFromObjectOptions {
    deleteKey?: boolean;
    noInit?: boolean;
}

const truthyValues = ["1", "y", "true", "yes"];

export function areRefsEqual(x: any, y: any): boolean {
    return String(x) === String(y);
}

export function asAsync<TFunc extends Function = Function>(func: Function): TFunc {
    if (typeof func !== "function") {
        throw new TypeError("func must be of type function");
    }

    if (func.constructor.name === "AsyncFunction") {
        return func as TFunc;
    }

    return (async function (...args: any[]) {
        return func(...args);
    }) as unknown as TFunc;
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

export function getListFromObject<T extends any = any>(
    obj: any,
    key: PropertyKey,
    options?: Nilable<IGetListFromObjectOptions>
): T[] {
    let list: Nilable<T[]> = obj[key];

    if (!list) {
        list = [];

        if (!options?.noInit) {
            obj[key] = list;
        }
    }

    if (options?.deleteKey) {
        delete obj[key];
    }

    return list;
}

export function isClass<T extends any = any>(maybeClass: any): maybeClass is Constructor<T> {
    return typeof maybeClass?.constructor === "function";
}

export function isNil(value: unknown): value is (undefined | null) {
    return typeof value === "undefined" ||
        value === null;
}

export function isTruthy(val: unknown): boolean {
    return truthyValues.includes(
        String(val ?? "").toLowerCase().trim()
    );
}

export async function loadModule(id: string): Promise<any> {
    if (moduleMode === "cjs") {
        return require(id);
    }

    return import(id);
}

export function normalizeRouterPath(p: Nilable<string>): string {
    if (!p?.length) {
        p = "";
    }

    p = p.split(path.sep)
        .map(x => {
            return x.trim();
        })
        .filter(x => {
            return x !== "";
        })
        .join("/")
        .trim();

    while (p.endsWith("/")) {
        p = p.substring(0, p.length - 1).trim();
    }
    while (p.startsWith("/")) {
        p = p.substring(1).trim();
    }

    if (!p.startsWith("/")) {
        p = "/" + p.trim();
    }

    return p;
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

                allChunks.length = 0;
            }
            catch (error) {
                reject(error);
            }
        });
    });
}

export function runsTSNode(): boolean {
    try {
        return !!(process as any)[Symbol.for("ts-node.register.instance")];
    }
    catch {
        return false;
    }
}
