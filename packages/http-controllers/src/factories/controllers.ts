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

import { HttpMiddleware, IHttpServer, moduleMode } from "@egomobile/http-server";
import minimatch, { MinimatchOptions } from "minimatch";
import fs from "node:fs";
import path from "node:path";
import { CONTROLLER_MIDDLEWARES, INIT_IMPORTS_ACTIONS, INIT_METHOD_ACTIONS, IS_CONTROLLER_CLASS } from "../constants/internal.js";
import type { IController, IControllerCreatedEventContext, IControllersOptions, ImportValues } from "../index.js";
import type { ControllerBase, IControllersResult } from "../types/index.js";
import type { Constructor, Nilable } from "../types/internal.js";
import { getAllClassProps, getListFromObject, isClass, isNil, loadModule, normalizeRouterPath, runsTSNode } from "../utils/internal.js";
import type { InitImportAction, InitMethodAction } from "./decorators.js";

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
    imports: ImportValues;
    noAutoEnd: Nilable<boolean>;
    noAutoParams: Nilable<boolean>;
    noAutoQuery: Nilable<boolean>;
    rootDir: string;
    server: HttpServer;
}

interface IInitializeControllersMethodOptions {
    events: NodeJS.EventEmitter;
    onControllersOptionsChange: (options: IControllersOptions) => void;
    onControllersResultChange: (result: IControllersResult) => void;
    server: HttpServer;
}

interface IInitializeControllersOptions {
    events: NodeJS.EventEmitter;
    imports: ImportValues;
    noAutoEnd: Nilable<boolean>;
    noAutoParams: Nilable<boolean>;
    noAutoQuery: Nilable<boolean>;
    patterns: string[];
    rootDir: string;
    server: HttpServer;
}

export async function initializeControllers({
    events,
    imports,
    noAutoEnd,
    noAutoParams,
    noAutoQuery,
    patterns,
    rootDir,
    server
}: IInitializeControllersOptions) {
    const result: IControllersResult = {
        "controllers": []
    };

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

    for (const cf of controllerFiles) {
        const module = await loadModule(cf.fullPath);

        const maybeClass = module.default ?? module;
        if (isClass<ControllerBase>(maybeClass)) {
            if ((maybeClass as any)[IS_CONTROLLER_CLASS]) {
                // must be "marked"
                // via class decorator

                result.controllers.push(
                    await initializeControllerInstance({
                        "controllerClass": maybeClass,
                        events,
                        "file": cf,
                        imports,
                        noAutoEnd,
                        noAutoParams,
                        noAutoQuery,
                        rootDir,
                        server
                    })
                );
            }
        }
    }

    if (!result.controllers.length) {
        throw new Error(`No matching controller classes found via patterns ${patterns}`);
    }

    return result;
};

export async function initializeControllerInstance({
    controllerClass,
    events,
    file,
    imports,
    noAutoEnd,
    noAutoParams,
    noAutoQuery,
    rootDir,
    server
}: IInitializeControllerInstanceOptions): Promise<IController> {
    const globalMiddlewares = getListFromObject<HttpMiddleware<any, any>>(controllerClass, CONTROLLER_MIDDLEWARES, {
        "deleteKey": true,
        "noInit": true
    });

    const newInstance = new controllerClass({
        "file": file.fullPath
    });

    const newController: IController = {
        "controller": newInstance,
        controllerClass,
        "fullPath": file.fullPath,
        "relativePath": file.relativePath,
        rootDir
    };

    // imports
    const initImportActions = getListFromObject<InitImportAction>(newInstance, INIT_IMPORTS_ACTIONS, {
        "deleteKey": true,
        "noInit": true
    });
    for (const action of initImportActions) {
        await action({
            "controller": newInstance,
            imports
        });
    }

    const classProps = getAllClassProps(controllerClass);

    for (const prop of classProps) {
        if (prop.trimStart().startsWith("_")) {
            continue;  // ignore all props with leading _
        }

        const maybeMethod: unknown = (newInstance as any)[prop];
        if (typeof maybeMethod !== "function") {
            continue;
        }

        // method actions
        const initMethodActions = getListFromObject<InitMethodAction>(maybeMethod, INIT_METHOD_ACTIONS, {
            "deleteKey": true,
            "noInit": true
        });
        for (const action of initMethodActions) {
            await action({
                "controller": newInstance,
                "fullPath": newController.fullPath,
                "middlewares": globalMiddlewares,
                noAutoEnd,
                noAutoParams,
                noAutoQuery,
                "relativePath": newController.relativePath,
                server
            });
        }
    }

    const createdContext: IControllerCreatedEventContext = {
        "controller": newController
    };

    // tell others, that new controller has been created
    events.emit("controller:created", createdContext);

    return newController;
}

export function initializeControllersMethod({
    events,
    onControllersOptionsChange,
    onControllersResultChange,
    server
}: IInitializeControllersMethodOptions) {
    server.controllers = async (...args: any[]) => {
        let options: IControllersOptions;
        if (isNil(args[0])) {
            options = {};
        }
        else {
            if (typeof args[0] === "string") {
                options = {
                    "rootDir": args[0],
                    "imports": args[1]
                };
            }
            else if (typeof args[0] === "object") {
                options = args[0];
            }
            else {
                throw new TypeError("First argument must be of type string or object");
            }
        }

        if (typeof options !== "object") {
            throw new TypeError("options must be of type object");
        }

        const imports = options?.imports;
        if (!isNil(imports)) {
            if (typeof imports !== "object") {
                throw new TypeError("options.imports must be of type object");
            }
        }

        let rootDir = options.rootDir;
        if (isNil(rootDir)) {
            rootDir = "controllers";
        }

        if (typeof rootDir !== "string") {
            throw new TypeError("options.rootDir must be of type string");
        }

        let patterns = options.patterns;
        if (isNil(patterns)) {
            patterns = [];
        }

        if (!patterns.length) {
            const extensions: string[] = [];

            if (runsTSNode()) {
                extensions.push("ts");

                if (moduleMode === "cjs") {
                    extensions.push("cts");
                }
                else if (moduleMode === "esm") {
                    extensions.push("mts");
                }
            }
            else {
                extensions.push("js");

                if (moduleMode === "cjs") {
                    extensions.push("cjs");
                }
                else if (moduleMode === "esm") {
                    extensions.push("mjs");
                }
            }

            patterns.push(`**/*.{${extensions.join()}}`);
        }

        if (!path.isAbsolute(rootDir)) {
            rootDir = path.join(process.cwd(), rootDir);
        }

        onControllersOptionsChange(options);

        const result = await initializeControllers({
            events,
            "imports": imports ?? {},
            "noAutoEnd": options?.noAutoEnd,
            "noAutoParams": options?.noAutoParams,
            "noAutoQuery": options?.noAutoQuery,
            patterns,
            rootDir,
            server
        });

        onControllersResultChange(result);

        return result;
    };
}
