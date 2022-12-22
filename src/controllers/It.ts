/* eslint-disable @typescript-eslint/naming-convention */

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
import type { IHttpController, IHttpServer, ITestSettings } from "..";
import { ADD_CONTROLLER_METHOD_TEST_ACTION, TEST_OPTIONS } from "../constants";
import type { InitControllerMethodTestAction, ITestOptions, Nilable, TestOptionsGetter } from "../types/internal";
import { asAsync, isNil } from "../utils";
import { getListFromObject, getMethodOrThrow } from "./utils";

interface IGetSettingsContext {
    controller: IHttpController<IHttpServer>;
    methodName: string | symbol;
}

interface IToTestOptionsOptions {
    controller: IHttpController<IHttpServer>;
    method: Function;
    methodName: string | symbol;
    name: string;
    settings: Nilable<ITestSettings>;
}

/**
 * A possible value for `settingsOrGetter` argument of `It()` decorator.
 * The value can be an `ITestSettings` object, a getter, which returns it
 * or a path to module with the settings (relative path will be mapped to
 * the controller's directory).
 */
export type ItSettingsOrGetter =
    ITestSettings |
    (() => ITestSettings) |
    (() => PromiseLike<ITestSettings>) |
    string;

/**
 * Sets up a request method for use in (unit-)tests.
 *
 * @param {string} name A description / name for the controller / class.
 * @param {Nilable<ItSettingsOrGetter>} [settingsOrGetter] Custom settings or a function, which return them.
 *
 * @example
 * ```
 * import { Controller, ControllerBase, Describe, GET, IHttpRequest, IHttpResponse, It } from '@egomobile/http-server'
 *
 * @Controller()
 * @Describe('My controller')
 * export default class MyController extends ControllerBase {
 *   @GET()
 *   @It('should run without error')
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     // your code
 *   }
 * }
 * ```
 *
 * @returns {MethodDecorator} The method decorator.
 */
export function It(name: string, settingsOrGetter?: Nilable<ItSettingsOrGetter>): MethodDecorator {
    if (typeof name !== "string") {
        throw new TypeError("name must be of type string");
    }

    let getSettings: (context: IGetSettingsContext) => Promise<Nilable<ITestSettings>>;
    if (isNil(settingsOrGetter)) {
        // default setting(s)
        getSettings = async () => {
            return settingsOrGetter as Nilable<ITestSettings>;
        };
    }
    else {
        if (typeof settingsOrGetter === "object") {
            // object
            getSettings = async () => {
                return settingsOrGetter as ITestSettings;
            };
        }
        else if (typeof settingsOrGetter === "function") {
            // getter
            getSettings = asAsync(settingsOrGetter);
        }
        else if (typeof settingsOrGetter === "string") {
            // module path
            getSettings = async ({ controller, methodName }) => {
                const controllerFileExt = path.extname(controller.__file);

                let moduleFile = settingsOrGetter;
                if (!moduleFile.endsWith(controllerFileExt)) {
                    moduleFile += controllerFileExt;
                }

                if (!path.isAbsolute(moduleFile)) {
                    const controllerDir = path.dirname(controller.__file);

                    moduleFile = path.join(controllerDir, moduleFile);
                }

                if (fs.existsSync(moduleFile)) {
                    throw new Error(`${moduleFile} not found`);
                }

                const stat = await fs.promises.stat(moduleFile);
                if (!stat.isFile()) {
                    throw new Error(`${moduleFile} is no file`);
                }

                const controllerSpecModule = require(moduleFile);

                return controllerSpecModule?.[methodName];
            };
        }
        else {
            throw new TypeError("settingsOrGetter must be of type object, string or function");
        }
    }

    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitControllerMethodTestAction>(method, ADD_CONTROLLER_METHOD_TEST_ACTION).push(
            ({ controller, server }) => {
                getListFromObject<TestOptionsGetter>(server, TEST_OPTIONS).push(
                    async () => {
                        return toTestOptions({
                            controller,
                            method,
                            methodName,
                            name,
                            "settings": await getSettings({
                                controller,
                                methodName
                            })
                        });
                    }
                );
            }
        );
    };
}

async function toTestOptions(options: IToTestOptionsOptions): Promise<ITestOptions> {
    const { controller, method, methodName, name } = options;
    let { settings } = options;

    if (isNil(settings)) {
        // try load from `.spec.??` file

        const controllerDir = path.dirname(controller.__file);
        const controllerFileExt = path.extname(controller.__file);
        const controllerBasename = path.basename(controller.__file, controllerFileExt);
        const controllerSpecFile = path.join(controllerDir, controllerBasename + ".spec" + controllerFileExt);

        if (fs.existsSync(controllerSpecFile)) {
            const stat = await fs.promises.stat(controllerSpecFile);
            if (!stat.isFile()) {
                throw new Error(`${controllerSpecFile} is no file`);
            }

            const controllerSpecModule = require(controllerSpecFile);

            settings = controllerSpecModule?.[methodName];
        }
    }

    if (!isNil(settings)) {
        if (typeof settings !== "object") {
            throw new TypeError("settings must be of type object");
        }
    }

    let getExpectedStatus = async () => {
        return 200;
    };
    if (!isNil(settings?.expections?.status)) {
        if (typeof settings!.expections!.status === "number") {
            getExpectedStatus = async () => {
                return settings!.expections!.status as number;
            };
        }
        else if (typeof settings!.expections!.status === "function") {
            getExpectedStatus = asAsync(settings!.expections!.status);
        }
        else {
            throw new TypeError("settings.expections.status must be of type number or function");
        }
    }

    let getExpectedHeaders = async (): Promise<Record<string, string | RegExp>> => {
        return {};
    };
    if (!isNil(settings?.expections?.headers)) {
        if (typeof settings!.expections!.status === "object") {
            getExpectedHeaders = async () => {
                return settings!.expections!.headers as Record<string, string | RegExp>;
            };
        }
        else if (typeof settings!.expections!.headers === "function") {
            getExpectedStatus = asAsync(settings!.expections!.headers);
        }
        else {
            throw new TypeError("settings.expections.headers must be of type object or function");
        }
    }

    let getExpectedBody = async (): Promise<any> => {
        return undefined;
    };
    if (!isNil(settings?.expections?.body)) {
        if (typeof settings!.expections!.headers === "function") {
            getExpectedStatus = asAsync(settings!.expections!.body);
        }
        else {
            getExpectedHeaders = async () => {
                return settings!.expections!.body;
            };
        }
    }

    let getParameters = async (): Promise<Record<string, string>> => {
        return {};
    };
    if (!isNil(settings?.parameters)) {
        if (typeof settings!.parameters === "object") {
            getParameters = async () => {
                return settings!.parameters as Record<string, string>;
            };
        }
        else if (typeof settings!.parameters === "function") {
            getParameters = asAsync(settings!.parameters!);
        }
        else {
            throw new TypeError("settings.getParameters must be of type object or function");
        }
    }

    let getHeaders = async (): Promise<Record<string, string>> => {
        return {};
    };
    if (!isNil(settings?.headers)) {
        if (typeof settings!.headers === "object") {
            getHeaders = async () => {
                return settings!.headers as Record<string, string>;
            };
        }
        else if (typeof settings!.parameters === "function") {
            getHeaders = asAsync(settings!.parameters!);
        }
        else {
            throw new TypeError("settings.getHeaders must be of type object or function");
        }
    }

    return {
        controller,
        getExpectedBody,
        getExpectedHeaders,
        getExpectedStatus,
        getHeaders,
        getParameters,
        method,
        methodName,
        name,
        "settings": settings || {}
    };
}
