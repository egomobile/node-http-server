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

import type { AfterAllTestsFunc, AfterEachTestFunc, BeforeAllTestsFunc, BeforeEachTestFunc, ICreateServerOptions, IHttpServer, ITestEventHandlerContext, ITestSettingValueGetterContext, TestResponseValidator } from "..";
import { ROUTER_PATHS, TEST_DESCRIPTION, TEST_OPTIONS } from "../constants";
import type { IRouterPathItem, ITestDescription, ITestOptions, Nilable, TestOptionsGetter } from "../types/internal";
import { asAsync } from "../utils";
import { getListFromObject } from "./utils";

export interface ISetupHttpServerTestMethodOptions {
    options: Nilable<ICreateServerOptions>;
    server: IHttpServer;
}

interface ITestRunnerActionContext {
    index: number;
    totalCount: number;
}

interface ITestRunnerItem {
    action: TestRunnerAction;
}

type TestRunnerAction = (rc: ITestRunnerActionContext) => Promise<void>;

export function setupHttpServerTestMethod(setupOptions: ISetupHttpServerTestMethodOptions) {
    const { server } = setupOptions;

    const afterAll = asAsync<AfterAllTestsFunc>(
        setupOptions.options?.tests?.afterAll || (async () => { })
    );
    const afterEach = asAsync<AfterEachTestFunc>(
        setupOptions.options?.tests?.afterEach || (async () => { })
    );
    const beforeAll = asAsync<BeforeAllTestsFunc>(
        setupOptions.options?.tests?.beforeAll || (async () => { })
    );
    const beforeEach = asAsync<BeforeEachTestFunc>(
        setupOptions.options?.tests?.beforeEach || (async () => { })
    );

    server.test = async () => {
        const allRunners: ITestRunnerItem[] = [];

        const allTestOptionGetters = getListFromObject<TestOptionsGetter>(server, TEST_OPTIONS, true, true);

        // we will organize all tests into
        // flat and separate list of runners (`allRunners`), so we can better
        // count and provide possibility to implement progress
        for (const getOptions of allTestOptionGetters) {
            ((options: ITestOptions) => {
                const { controller, getExpectedHeaders, getExpectedStatus, getHeaders, getParameters, method, methodName } = options;
                const validator = typeof options.settings.validator === "function" ?
                    asAsync<TestResponseValidator>(options.settings.validator) :
                    undefined;

                const description: ITestDescription = (controller as any)[TEST_DESCRIPTION];
                if (typeof description !== "object") {
                    return;  // tests not enabled
                }

                const allRouterPaths: Nilable<IRouterPathItem[]> = (method as any)[ROUTER_PATHS];
                if (!allRouterPaths?.length) {
                    throw new Error(`Method ${String(methodName)} in controller ${controller.__file} is no request handler`);
                }

                allRouterPaths.forEach(({ httpMethod, "routerPath": route }) => {
                    allRunners.push({
                        "action": async (runnerContext) => {
                            const valueGetterContext: ITestSettingValueGetterContext = {
                            };

                            // create object with headers with lowercase keys
                            const headers: Record<string, string> = {};
                            for (const [key, value] of Object.entries(await getHeaders(valueGetterContext))) {
                                headers[key.toLowerCase().trim()] = String(value ?? "");
                            }

                            const parameters = await getParameters(valueGetterContext);

                            let escapedRoute = route;
                            for (const [paramName, paramValue] of Object.entries(parameters)) {
                                escapedRoute = escapedRoute
                                    .split(`:${paramName}`)
                                    .join(encodeURIComponent(paramValue));
                            }

                            const testContext: ITestEventHandlerContext = {
                                "context": "controller",
                                "describe": description.name,
                                escapedRoute,
                                "expectations": {
                                    "headers": await getExpectedHeaders(valueGetterContext),
                                    "status": await getExpectedStatus(valueGetterContext)
                                },
                                "file": controller.__file,
                                headers,
                                httpMethod,
                                "index": runnerContext.index,
                                "it": options.name,
                                methodName,
                                route,
                                parameters,
                                server,
                                "totalCount": runnerContext.totalCount,
                                "validate": validator
                            };

                            await server.emit("test", testContext);
                        }
                    });
                });
            })(await getOptions());
        }

        const totalCount = allRunners.length;
        let globalError: any;

        // global preparations
        await beforeAll({
            totalCount
        });
        try {
            // now execute runners
            for (let i = 0; i < totalCount; i++) {
                let testError: any;

                try {
                    // test preparations
                    await beforeEach({
                        "index": i,
                        totalCount
                    });

                    const runner = allRunners[i];
                    const { action } = runner;

                    await action({
                        "index": i,
                        totalCount
                    });
                }
                catch (error) {
                    testError = error;
                }
                finally {
                    // test cleanups
                    await afterEach({
                        "error": testError,
                        "index": i,
                        totalCount
                    });
                }
            }
        }
        catch (error) {
            globalError = error;
        }
        finally {
            // global cleanups
            await afterAll({
                "error": globalError,
                totalCount
            });
        }
    };
}
