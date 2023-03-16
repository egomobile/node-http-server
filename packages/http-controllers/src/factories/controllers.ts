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

import type { HttpMiddleware, IHttpServer } from "@egomobile/http-server";
import minimatch, { MinimatchOptions } from "minimatch";
import fs from "node:fs";
import path from "node:path";
import { CONTROLLER_MIDDLEWARES, INIT_METHOD_ACTIONS, IS_CONTROLLER_CLASS } from "../constants/internal.js";
import { controllerCreatedEvent, IControllerCreatedEventContext } from "../index.js";
import type { ControllerBase, IControllersResult } from "../types/index.js";
import type { Constructor, Nilable } from "../types/internal.js";
import { getAllClassProps, getListFromObject, isClass, loadModule, normalizeRouterPath } from "../utils/internal.js";
import type { InitMethodAction } from "./decorators.js";

const { readdir, stat } = fs.promises;

type HttpServer = IHttpServer<any, any>;

interface IControllerFile {
    fullPath: string;
    relativePath: string;
}

interface IInitializeControllerInstanceOptions {
    controllerClass: Constructor<ControllerBase>;
    events: NodeJS.EventEmitter;
    file: IControllerFile;
    noAutoEnd: Nilable<boolean>;
    noAutoParams: Nilable<boolean>;
    noAutoQuery: Nilable<boolean>;
    server: HttpServer;
}

interface IInitializeControllersOptions {
    events: NodeJS.EventEmitter;
    noAutoEnd: Nilable<boolean>;
    noAutoParams: Nilable<boolean>;
    noAutoQuery: Nilable<boolean>;
    patterns: string[];
    rootDir: string;
    server: HttpServer;
}

export async function initializeControllers({
    events,
    noAutoEnd,
    noAutoParams,
    noAutoQuery,
    patterns,
    rootDir,
    server
}: IInitializeControllersOptions) {
    const result: IControllersResult = {};

    const minimatchOpts: MinimatchOptions = {
        "dot": false,
        "matchBase": true
    };

    const controllerFiles: IControllerFile[] = [];

    const scanDir = async (dir = rootDir) => {
        for (const item of await readdir(dir)) {
            if (item.trim().startsWith("_")) {
                continue;  // no loading _
            }

            const fullPath = path.join(dir, item);
            const relativePath = normalizeRouterPath(
                path.relative(rootDir, fullPath)
            );

            const stats = await stat(fullPath);
            if (stats.isDirectory()) {
                await scanDir(fullPath);
            }
            else {
                const isFileMatching = patterns.some((p) => {
                    return minimatch(relativePath, p, minimatchOpts);
                });

                if (isFileMatching) {
                    controllerFiles.push({
                        fullPath,
                        relativePath
                    });
                }
            }
        }
    };

    await scanDir();

    const controllers: ControllerBase[] = [];

    for (const cf of controllerFiles) {
        const module = await loadModule(cf.fullPath);

        const maybeClass = module.default ?? module;
        if (isClass<ControllerBase>(maybeClass)) {
            if ((maybeClass as any)[IS_CONTROLLER_CLASS]) {
                // must be "marked"
                // via class decorator
                controllers.push(
                    await initializeControllerInstance({
                        "controllerClass": maybeClass,
                        events,
                        "file": cf,
                        noAutoEnd,
                        noAutoParams,
                        noAutoQuery,
                        server
                    })
                );
            }
        }
    }

    if (!controllers.length) {
        throw new Error(`No matching controller classes found via patterns ${patterns}`);
    }

    return result;
};

export async function initializeControllerInstance({
    controllerClass,
    events,
    file,
    noAutoEnd,
    noAutoParams,
    noAutoQuery,
    server
}: IInitializeControllerInstanceOptions): Promise<ControllerBase> {
    const globalMiddlewares = getListFromObject<HttpMiddleware<any, any>>(controllerClass, CONTROLLER_MIDDLEWARES, {
        "deleteKey": true,
        "noInit": true
    });

    const newController = new controllerClass({
        "file": file.fullPath
    });

    events.emit(controllerCreatedEvent, {
        "controller": newController,
        controllerClass,
        "fullPath": file.fullPath,
        "relativePath": file.relativePath
    } as IControllerCreatedEventContext);

    const classProps = getAllClassProps(controllerClass);

    for (const prop of classProps) {
        if (prop.trimStart().startsWith("_")) {
            continue;  // ignore all props with leading _
        }

        const propValue: unknown = (newController as any)[prop];
        if (typeof propValue !== "function") {
            continue;
        }

        // method actions
        const initMethodActions = getListFromObject<InitMethodAction>(propValue, INIT_METHOD_ACTIONS, {
            "deleteKey": true,
            "noInit": true
        });
        for (const action of initMethodActions) {
            await action({
                "controller": newController,
                "fullPath": file.fullPath,
                "middlewares": globalMiddlewares,
                noAutoEnd,
                noAutoParams,
                noAutoQuery,
                "relativePath": file.relativePath,
                server
            });
        }
    }

    return newController;
}
