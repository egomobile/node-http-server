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

import { IHttpServer, IHttpServerExtenderContext, moduleMode } from "@egomobile/http-server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { TEST_ACTIONS, TEST_DESCRIPTIONS } from "../constants/internal.js";
import { AfterAllTestsFunc, AfterEachTestFunc, BeforeAllTestsFunc, BeforeEachTestFunc, ControllerTestEventListener, IController, IControllersOptions, IControllersResult, IControllerTestEventListenerContext, IControllerTestResult, ITestSession, ITestSettings, ITestSettingValueGetterContext, TestSettingValueOrGetter, TestSpecItem } from "../index.js";
import type { ITestAction, ITestDescription, Nilable, Nullable, Optional } from "../types/internal.js";
import { areRefsEqual, asAsync, getAllClassProps, getListFromObject, isNil, loadModule } from "../utils/internal.js";

interface ICreateTestEventListenerContextFromSpecItemOptions {
    controller: IController;
    item: TestSpecItem;
    session: ITestSession;
}

interface ICreateTestActionsOptions {
    afterEach: AfterEachTestFunc;
    beforeEach: BeforeEachTestFunc;
    controller: IController;
    listener: ControllerTestEventListener;
    session: ITestSession;
    shouldThrowErrorIfNoTestsFound: boolean;
}

interface IInitializeTestMethodOptions {
    extenderContext: IHttpServerExtenderContext<any, any>;
    getLastControllersOptions: () => Optional<IControllersOptions>;
    getLastControllersResult: () => Optional<IControllersResult>;
    server: IHttpServer<any, any>;
}

async function createTestEventListenerContextFromSpecItem({
    controller,
    item,
    session
}: ICreateTestEventListenerContextFromSpecItemOptions): Promise<IControllerTestEventListenerContext> {
    let settings: Partial<ITestSettings> = {};
    if (typeof item === "function") {
        settings.validator = item;
    }
    else {
        settings = item;
    }

    // TODO: implement
    const settingsValueContext: ITestSettingValueGetterContext = {
    } as any;

    const body = await getTestSettingValue(settings.body, settingsValueContext) ?? null;
    const expectations = await getTestSettingValue(settings.expectations, settingsValueContext) ?? {};
    const headers = await getTestSettingValue(settings.headers, settingsValueContext) ?? {};
    const parameters = await getTestSettingValue(settings.parameters, settingsValueContext) ?? {};
    const query = await getTestSettingValue(settings.query, settingsValueContext) ?? {};
    const validator = settings.validator ?? undefined;

    if (typeof expectations !== "object") {
        throw new TypeError("settings.expectations must be of type object");
    }
    if (typeof headers !== "object") {
        throw new TypeError("settings.headers must be of type object");
    }
    if (typeof parameters !== "object") {
        throw new TypeError("settings.parameters must be of type object");
    }
    if (typeof query !== "object") {
        throw new TypeError("settings.query must be of type object");
    }

    if (validator && typeof validator !== "function") {
        throw new TypeError("settings.validator must be of type function");
    }

    return {
        body,
        controller,
        expectations,
        headers,
        parameters,
        query,
        session,
        "start": new Date(),
        validator
    };
}

export async function createTestActions({
    "afterEach": globalAfterEach,
    "beforeEach": globalBeforeEach,
    controller,
    listener,
    session,
    shouldThrowErrorIfNoTestsFound
}: ICreateTestActionsOptions) {
    const {
        "controller": controllerInstance,
        controllerClass
    } = controller;

    const actions: (() => Promise<void>)[] = [];

    const classProps = getAllClassProps(controllerClass);

    getListFromObject<ITestDescription>(controllerClass, TEST_DESCRIPTIONS, {
        "deleteKey": false,
        "noInit": true
    }).forEach((describe) => {
        classProps.forEach((prop) => {
            const maybeMethod: unknown = (controllerInstance as any)[prop];
            if (typeof maybeMethod !== "function") {
                return;
            }

            getListFromObject<ITestAction>(maybeMethod, TEST_ACTIONS, {
                "deleteKey": false,
                "noInit": true
            }).forEach((it) => {
                actions.push(async () => {
                    const scriptPath = await getScriptPathByController(
                        controller, it.script ?? describe.script
                    );

                    if (!scriptPath) {
                        throw new Error(`No .spec script found for controller test ['${describe.name}'] '${it.description}' in ${controller.fullPath}`);
                    }

                    const module = await loadModule(scriptPath);

                    const afterAll = asAsync<AfterAllTestsFunc>(module.afterAll ?? (async () => { }));
                    if (typeof afterAll !== "function") {
                        throw new TypeError("module.afterAll must be of type function");
                    }

                    const beforeAll = asAsync<BeforeAllTestsFunc>(module.beforeAll ?? (async () => { }));
                    if (typeof beforeAll !== "function") {
                        throw new TypeError("module.beforeAll must be of type function");
                    }

                    const afterEach = asAsync<AfterEachTestFunc>(module.afterEach ?? (async () => { }));
                    if (typeof afterEach !== "function") {
                        throw new TypeError("module.afterEach must be of type function");
                    }

                    const beforeEach = asAsync<BeforeEachTestFunc>(module.beforeEach ?? (async () => { }));
                    if (typeof beforeEach !== "function") {
                        throw new TypeError("module.beforeEach must be of type function");
                    }

                    const matchingItems: TestSpecItem[] = [];

                    let specItems: TestSpecItem | TestSpecItem[] = module[it.name];
                    if (specItems) {
                        specItems = (Array.isArray(specItems) ? specItems : [specItems])
                            .filter((value) => {
                                return !!value;
                            });

                        matchingItems.push(
                            ...specItems
                                .filter((item) => {
                                    return typeof item === "function" ||
                                        areRefsEqual(item.ref, it.ref);
                                })
                        );
                    }
                    else {
                        if (shouldThrowErrorIfNoTestsFound) {
                            throw new Error(`No exported test specifications for controller test ['${describe.name}'] '${it.description}' found in ${scriptPath}`);
                        }
                    }

                    const matchingItemCount = matchingItems.length;
                    if (matchingItemCount < 1) {
                        if (shouldThrowErrorIfNoTestsFound) {
                            throw new Error(`No exported test specifications with reference ${String(it.ref)} for controller test ['${describe.name}'] '${it.description}' found in ${scriptPath}`);
                        }

                        return;  // nothing to do
                    }

                    let failCount = 0;
                    let successCount = 0;

                    // "before all" logic for this script / module
                    await beforeAll({
                        session
                    });

                    let lastGlobalError: any;
                    try {
                        for (let i = 0; i < matchingItemCount; i++) {
                            const item = matchingItems[i];

                            let lastError: any;

                            // "before each" logics
                            await globalBeforeEach({
                                "index": i,
                                session,
                                "totalCount": matchingItemCount
                            });
                            await beforeEach({
                                "index": i,
                                session,
                                "totalCount": matchingItemCount
                            });

                            try {
                                await listener(
                                    await createTestEventListenerContextFromSpecItem({
                                        controller,
                                        item,
                                        session
                                    })
                                );

                                ++successCount;
                            }
                            catch (error) {
                                ++failCount;
                                lastError = error;

                                throw error;
                            }
                            finally {
                                // "after each" logics

                                await afterEach({
                                    "error": lastError,
                                    "index": i,
                                    session,
                                    "totalCount": matchingItemCount
                                });
                                await globalAfterEach({
                                    "error": lastError,
                                    "index": i,
                                    session,
                                    "totalCount": matchingItemCount
                                });
                            }
                        }
                    }
                    catch (error) {
                        lastGlobalError = error;

                        throw error;
                    }
                    finally {
                        // "after all" logic for this script / module

                        await afterAll({
                            "error": lastGlobalError,
                            failCount,
                            session,
                            "totalCount": failCount + successCount
                        });
                    }
                });
            });
        });
    });

    return actions;
}

async function getTestSettingValue<T>(
    valueOrGetter: Nilable<TestSettingValueOrGetter<T>>,
    context: ITestSettingValueGetterContext
): Promise<Nilable<T>> {
    if (valueOrGetter) {
        if (typeof valueOrGetter === "function") {
            return Promise.resolve((valueOrGetter as any)(context));
        }
    }

    return valueOrGetter;
}

async function getScriptPathByController(controller: IController, customScript: Nilable<string>): Promise<Nullable<string>> {
    const controllerDir = path.dirname(controller.fullPath);

    let scriptPath = customScript?.trim();
    if (!scriptPath) {
        const controllerFileName = path.basename(controller.fullPath);
        const controllerFileExt = path.extname(controller.fullPath);
        const controllerBaseName = path.basename(controllerFileName, controllerFileExt);

        const possibleFileExts = new Set<string>([controllerFileExt]);
        if (controllerFileExt.endsWith("ts")) {
            // TypeScript

            possibleFileExts.add(".ts");
            possibleFileExts.add(moduleMode === "esm" ? ".mts" : ".cts");
        }
        else {
            // JavaScript

            possibleFileExts.add(".js");
            possibleFileExts.add(moduleMode === "esm" ? ".mjs" : ".cjs");
        }

        for (const ext of possibleFileExts) {
            const possibleScriptPath = path.join(
                controllerDir, `${controllerBaseName}.spec${ext}`
            );

            if (!fs.existsSync(possibleScriptPath)) {
                continue;
            }

            const stats = await fs.promises.stat(possibleScriptPath);
            if (stats.isFile()) {
                scriptPath = possibleScriptPath;
                break;
            }
        }
    }

    if (!scriptPath) {
        return null;
    }

    if (!path.isAbsolute(scriptPath)) {
        scriptPath = path.join(controllerDir, scriptPath);
    }

    return scriptPath;
}

export function initializeTestMethod({
    extenderContext,
    getLastControllersOptions,
    getLastControllersResult,
    server
}: IInitializeTestMethodOptions) {
    let testListeners: ControllerTestEventListener[] = [];

    // extenderContext.off()
    const oldOff = extenderContext.off.bind(extenderContext);
    extenderContext.off = (...args: any[]) => {
        if (args[0] === "test") {
            const listenerToRemove = args[1];

            testListeners = testListeners.filter((listener) => {
                return listener !== listenerToRemove;
            });

            return extenderContext;
        }

        return (oldOff as any)(...args);
    };

    // extenderContext.on()
    const oldOn = extenderContext.on.bind(extenderContext);
    extenderContext.on = (...args: any[]) => {
        if (args[0] === "test") {
            testListeners.push(asAsync(args[1]));

            return extenderContext;
        }

        return (oldOn as any)(...args);
    };

    // server.test()
    server.test = async (options) => {
        const afterAll = asAsync<AfterAllTestsFunc>(options?.afterAll ?? (async () => { }));
        if (typeof afterAll !== "function") {
            throw new TypeError("options.afterAll must be of type function");
        }

        const afterEach = asAsync<AfterEachTestFunc>(options?.afterEach ?? (async () => { }));
        if (typeof afterEach !== "function") {
            throw new TypeError("options.afterEach must be of type function");
        }

        const beforeAll = asAsync<BeforeAllTestsFunc>(options?.beforeAll ?? (async () => { }));
        if (typeof beforeAll !== "function") {
            throw new TypeError("options.beforeAll must be of type function");
        }

        const beforeEach = asAsync<BeforeEachTestFunc>(options?.beforeEach ?? (async () => { }));
        if (typeof beforeEach !== "function") {
            throw new TypeError("options.beforeEach must be of type function");
        }

        const lastLoadedControllers = [...(getLastControllersResult()?.controllers ?? [])];
        if (!lastLoadedControllers.length) {
            throw new Error("no controllers loaded yet");
        }

        const lastControllersOptions: IControllersOptions = {
            ...getLastControllersOptions()!
        };

        const shouldThrowErrorIfNoTestsFound = isNil(lastControllersOptions.requiresTestsEverywhere) ?
            true :
            !!lastControllersOptions.requiresTestsEverywhere;

        const testListenersToExecute = [...testListeners];

        const start = new Date();

        const session: ITestSession = {
            "id": Symbol(`${start.valueOf()}-${crypto.randomBytes(24).toString("hex")}`),
            start
        };

        const result: IControllerTestResult = {
            "failCount": 0,
            session,
            "successCount": 0
        };

        // global "before all" logic
        await beforeAll({
            "session": result.session
        });

        try {
            for (const controller of lastLoadedControllers) {
                for (const listener of testListenersToExecute) {
                    const actions = await createTestActions({
                        afterEach,
                        beforeEach,
                        controller,
                        listener,
                        "session": result.session,
                        shouldThrowErrorIfNoTestsFound
                    });

                    for (const action of actions) {
                        try {
                            await action();

                            ++result.successCount;
                        }
                        catch {
                            ++result.failCount;
                        }
                    }
                }
            }

            session.end = new Date();
        }
        catch (error) {
            session.end = new Date();
            session.error = error;

            result.error = error;
        }
        finally {
            // global "after all" logic

            await afterAll({
                "error": result.error,
                "failCount": result.failCount,
                "session": result.session,
                "totalCount": result.failCount + result.successCount
            });
        }

        return result;
    };
}