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
import type { IHttpController, IHttpServer, ITestSettings, TestResponseValidator } from "..";
import { ADD_CONTROLLER_METHOD_TEST_ACTION, TEST_OPTIONS } from "../constants";
import type { InitControllerMethodTestAction, ITestOptions, Nilable, TestOptionsGetter } from "../types/internal";
import { asAsync, isNil } from "../utils";
import { getListFromObject, getMethodOrThrow } from "./utils";

interface IGetSettingsContext {
    controller: IHttpController<IHttpServer>;
    methodName: string | symbol;
}

interface IToTestOptionsOptions {
    shouldAllowEmptySettings: boolean;
    controller: IHttpController<IHttpServer>;
    method: Function;
    methodName: string | symbol;
    name: string;
    settings: Nilable<ITestSettings>;
    shouldUseModuleAsDefault: boolean;
    timeout: number;
}

/**
 * Possible value for second value of `@It()` decorator.
 *
 * - `object` => use as settings object
 * - `function` => use custom validator
 * - `string` => path to a module, relative paths will be mapped to the directory of the underlying controller (file)
 */
export type ItSettingsOrValidator =
    ITestSettings |
    TestResponseValidator |
    string;

/**
 * Sets up a request method for use in (unit-)tests.
 *
 * @param {string} name A description / name for the controller / class.
 * @param {Nilable<ItSettingsOrValidator>} [settingsOrValidator] Custom settings or a function, which validates a response.
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
export function It(name: string, settingsOrValidator?: Nilable<ItSettingsOrValidator>): MethodDecorator {
    if (typeof name !== "string") {
        throw new TypeError("name must be of type string");
    }

    let getSettings: (context: IGetSettingsContext) => Promise<Nilable<ITestSettings>>;
    if (isNil(settingsOrValidator)) {
        getSettings = async () => {
            return settingsOrValidator as Nilable<ITestSettings>;
        };
    }
    else {
        if (typeof settingsOrValidator === "object") {
            const settings = settingsOrValidator as ITestSettings;

            getSettings = async () => {
                return settings;
            };
        }
        else if (typeof settingsOrValidator === "function") {
            const validator = asAsync<TestResponseValidator>(settingsOrValidator);

            getSettings = async () => {
                return {
                    validator
                };
            };
        }
        else if (typeof settingsOrValidator === "string") {
            const pathToModule = settingsOrValidator;

            getSettings = async ({ controller, methodName }) => {
                const controllerFileExt = path.extname(controller.__file);

                let moduleFile = pathToModule;
                if (!moduleFile.endsWith(controllerFileExt)) {
                    moduleFile += controllerFileExt;
                }

                if (!path.isAbsolute(moduleFile)) {
                    const controllerDir = path.dirname(controller.__file);

                    moduleFile = path.join(controllerDir, moduleFile);
                }

                if (!fs.existsSync(moduleFile)) {
                    throw new Error(`${moduleFile} not found`);
                }

                const stat = await fs.promises.stat(moduleFile);
                if (!stat.isFile()) {
                    throw new Error(`${moduleFile} is no file`);
                }

                const controllerSpecModule = require(moduleFile);

                // try to find an export, with the exact the same name / key
                // as the underlying controller method
                return toSettings(controllerSpecModule?.[methodName]);
            };
        }
        else {
            throw new TypeError("settingsOrGetter must be of type object, string or function");
        }
    }

    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitControllerMethodTestAction>(method, ADD_CONTROLLER_METHOD_TEST_ACTION).push(
            ({ controller, server, shouldAllowEmptySettings, shouldUseModuleAsDefault, timeout }) => {
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
                            }),
                            shouldAllowEmptySettings,
                            shouldUseModuleAsDefault,
                            timeout
                        });
                    }
                );
            }
        );
    };
}

function toSettings(val: unknown): Nilable<ITestSettings> {
    if (typeof val === "function") {
        return {
            "validator": asAsync<TestResponseValidator>(val)
        };
    }

    if (typeof val === "object" || isNil(val)) {
        return val as Nilable<ITestSettings>;
    }

    throw new TypeError("val must be of type function or object");
}

async function toTestOptions(options: IToTestOptionsOptions): Promise<ITestOptions> {
    const { controller, method, methodName, name, shouldAllowEmptySettings, shouldUseModuleAsDefault, timeout } = options;
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

            // try to find an export, with the exact the same name / key
            // as the underlying controller method
            settings = toSettings(controllerSpecModule?.[methodName]);
        }
        else {
            if (shouldUseModuleAsDefault) {
                // required
                throw new Error(`${controllerSpecFile} required but not found`);
            }
        }
    }

    if (isNil(settings)) {
        if (!shouldAllowEmptySettings) {
            throw new TypeError("settings cannot be empty");
        }
    }
    else {
        if (typeof settings !== "object") {
            throw new TypeError("settings must be of type object");
        }
    }

    let getExpectedStatus = async () => {
        return 200;
    };
    if (!isNil(settings?.expectations?.status)) {
        if (typeof settings!.expectations!.status === "number") {
            getExpectedStatus = async () => {
                return settings!.expectations!.status as number;
            };
        }
        else if (typeof settings!.expectations!.status === "function") {
            getExpectedStatus = asAsync(settings!.expectations!.status);
        }
        else {
            throw new TypeError("settings.expectations.status must be of type number or function");
        }
    }

    let getExpectedHeaders = async (): Promise<Record<string, string | RegExp>> => {
        return {};
    };
    if (!isNil(settings?.expectations?.headers)) {
        if (typeof settings!.expectations!.headers === "object") {
            getExpectedHeaders = async () => {
                return settings!.expectations!.headers as Record<string, string | RegExp>;
            };
        }
        else if (typeof settings!.expectations!.headers === "function") {
            getExpectedHeaders = asAsync(settings!.expectations!.headers);
        }
        else {
            throw new TypeError("settings.expectations.headers must be of type object or function");
        }
    }

    let getExpectedBody = async (): Promise<any> => {
        return undefined;
    };
    if (!isNil(settings?.expectations?.body)) {
        if (typeof settings!.expectations!.body === "function") {
            getExpectedBody = asAsync(settings!.expectations!.body);
        }
        else {
            getExpectedBody = async () => {
                return settings!.expectations!.body;
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
            throw new TypeError("settings.parameters must be of type object or function");
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
        else if (typeof settings!.headers === "function") {
            getHeaders = asAsync(settings!.headers!);
        }
        else {
            throw new TypeError("settings.headers must be of type object or function");
        }
    }

    let getBody: () => Promise<any>;
    if (typeof settings!.body === "function") {
        getBody = asAsync(settings!.body!);
    }
    else {
        const body = settings!.body;

        getBody = async () => {
            return body;
        };
    }

    let getTimeout: () => Promise<number>;
    if (isNil(settings?.timeout)) {
        getTimeout = async () => {
            return timeout;
        };
    }
    else {
        if (typeof settings!.timeout === "number") {
            const customTimeout = settings?.timeout as number;

            getTimeout = async () => {
                return customTimeout;
            };
        }
        else if (typeof settings!.timeout === "function") {
            getTimeout = asAsync(settings!.timeout);
        }
        else {
            throw new TypeError("settings.timeout must be of type number or function");
        }
    }

    return {
        controller,
        getBody,
        getExpectedBody,
        getExpectedHeaders,
        getExpectedStatus,
        getHeaders,
        getParameters,
        getTimeout,
        method,
        methodName,
        name,
        "settings": settings || {}
    };
}
