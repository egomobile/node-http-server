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

type GetTestSettingsFunc =
    (context: IGetSettingsContext) => Promise<Nilable<ITestSettings>>;

interface IGetSettingsContext {
    controller: IHttpController<IHttpServer>;
    index: number;
    methodName: string | symbol;
}

/**
 * Possible value for second value of `@It()` decorator.
 */
export type ItArgument2 =
    ItSettingsValue |
    ItRefValue;

/**
 * Possible value for 3rd value of `@It()` decorator.
 */
export type ItArgument3 =
    ItSettingsValue;

interface IToGetTestSettingsFuncOptions {
    arg2: any;
    arg3?: any;
    noRefCheck?: boolean;
    ref: any;
}

interface IToSettingsOptions {
    index: number;
    noArrayCheck?: boolean;
    ref: any;
    value: any;
}

interface IToTestOptionsOptions {
    shouldAllowEmptySettings: boolean;
    controller: IHttpController<IHttpServer>;
    index: number;
    method: Function;
    methodName: string | symbol;
    name: string;
    settings: Nilable<ITestSettings>;
    shouldUseModuleAsDefault: boolean;
    timeout: number;
}

/**
 * A possible value for a reference in `@It()` decorator.
 */
export type ItRefValue =
    bigint |
    number |
    symbol;

/**
 * A possible value for settings.
 */
export type ItSettingsValue =
    ITestSettings |
    TestResponseValidator |
    string;

/**
 * Sets up a request method for use in (unit-)tests.
 *
 * @param {string} name A description / name for the controller / class.
 * @param {bigint|number|symbol} ref The custom reference value.
 * @param {string} script The path to the script, which should be used to import settings.
 *                        Relative paths will be mapped to the controller's directory.
 * @param {ITestSettings} settings The settings.
 * @param {TestResponseValidator} validator The response validator.
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

export function It(name: string): MethodDecorator;
export function It(name: string, settings: ITestSettings): MethodDecorator;
export function It(name: string, validator: TestResponseValidator): MethodDecorator;
export function It(name: string, script: string): MethodDecorator;
export function It(name: string, ref: bigint | number | symbol, arg3?: Nilable<ItArgument3>): MethodDecorator;
export function It(name: string, arg2?: Nilable<ItArgument2>, arg3?: Nilable<ItArgument3>): MethodDecorator {
    if (typeof name !== "string") {
        throw new TypeError("name must be of type string");
    }

    const getSettings = toGetTestSettingsFunc({
        arg2,
        arg3,
        "ref": name
    });

    return function (target, methodName, descriptor) {
        const method = getMethodOrThrow(descriptor);

        getListFromObject<InitControllerMethodTestAction>(method, ADD_CONTROLLER_METHOD_TEST_ACTION).push(
            ({ controller, index, server, shouldAllowEmptySettings, shouldUseModuleAsDefault, timeout }) => {
                getListFromObject<TestOptionsGetter>(server, TEST_OPTIONS).push(
                    async () => {
                        return toTestOptions({
                            controller,
                            index,
                            method,
                            methodName,
                            name,
                            "settings": await getSettings({
                                controller,
                                index,
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

function toGetTestSettingsFunc(options: IToGetTestSettingsFuncOptions): GetTestSettingsFunc {
    const { arg2, arg3, noRefCheck, ref } = options;

    if (isNil(arg2)) {
        // default

        return async () => {
            return arg2 as Nilable<ITestSettings>;
        };
    }

    if (typeof arg2 === "object") {
        // test settings

        return async () => {
            return arg2! as ITestSettings;
        };
    }

    if (typeof arg2 === "function") {
        // response validator

        return async () => {
            return {
                ref,
                "validator": arg2 as TestResponseValidator
            };
        };
    }

    if (typeof arg2 === "string") {
        // custom script file

        return async ({ controller, index, methodName }) => {
            const controllerFileExt = path.extname(controller.__file);

            let moduleFile = arg2 as string;
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
            return toSettings({
                index,
                ref,
                "value": controllerSpecModule?.[methodName]
            });
        };
    }

    if (!noRefCheck) {
        if (["number", "symbol", "bigint"].includes(typeof arg2)) {
            // custom `ref`

            const getSettings = toGetTestSettingsFunc({
                "arg2": arg3, // `arg3` is now used to create a `getSettings()` function from ...
                "noRefCheck": true, // ... but not handled as custom `ref` value
                "ref": arg2  // custom ref
            });

            return async (settingsContext) => {
                return {
                    ...(await getSettings(settingsContext) ?? {}),

                    "ref": arg2
                };
            };
        }
    }

    throw new TypeError("options.value must be of type object, string, number, bigint, symbol or function");
}

function toSettings(options: IToSettingsOptions): Nilable<ITestSettings> {
    const { index, noArrayCheck, ref, value } = options;

    if (isNil(value)) {
        return value as Nilable<ITestSettings>;
    }

    if (!noArrayCheck) {
        if (Array.isArray(value)) {
            // map items to `ITestSettings`
            const settings = value.map((item) => {
                return toSettings({
                    ...options,

                    "value": item,
                    "noArrayCheck": true
                });
            });

            // first try to find an `ITestSettings`
            // with a `ref` prop, which has the same value
            // as the one submitted to `name` property of
            // `@It()` decorator
            let matchingSettings = settings.find((item) => {
                return typeof item === "object" &&
                    !isNil(item?.ref) &&
                    String(item!.ref) === String(ref);
            });
            if (matchingSettings) {
                return matchingSettings;
            }
            else {
                // now try by index
                return settings[index];
            }
        }
    }

    if (typeof value === "function") {
        return {
            "validator": asAsync<TestResponseValidator>(value)
        };
    }

    if (typeof value === "object") {
        const settings = value as Nilable<ITestSettings>;
        if (!isNil(ref)) {
            // required matching `ref` values
            if (settings?.ref === ref) {
                return settings;
            }
            else {
                return undefined;  // not found
            }
        }

        return settings;
    }

    throw new TypeError("options.value must be of type function or object");
}

async function toTestOptions(options: IToTestOptionsOptions): Promise<ITestOptions> {
    const {
        controller,
        index,
        method,
        methodName,
        name,
        shouldAllowEmptySettings,
        shouldUseModuleAsDefault,
        timeout
    } = options;
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
            settings = toSettings({
                index,
                "ref": name,
                "value": controllerSpecModule?.[methodName]
            });
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
        index,
        method,
        methodName,
        name,
        "settings": settings || {}
    };
}
