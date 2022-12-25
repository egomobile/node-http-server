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

import { AfterAllTestsFunc, AfterEachTestFunc, BeforeAllTestsFunc, BeforeEachTestFunc, CancellationError, CancellationReason, ICreateServerOptions, IHttpServer, ITestEventCancellationEventHandlerContext, ITestEventHandlerContext, ITestSettingValueGetterContext, TestEventCancellationEventHandler, TestResponseValidator, TimeoutError } from "..";
import { ROUTER_PATHS, TEST_DESCRIPTION, TEST_OPTIONS } from "../constants";
import type { IRouterPathItem, ITestDescription, ITestOptions, Nilable, Optional, TestOptionsGetter } from "../types/internal";
import { asAsync, isNil } from "../utils";
import { getListFromObject } from "./utils";

export interface ISetupHttpServerTestMethodOptions {
    options: Nilable<ICreateServerOptions>;
    server: IHttpServer;
}

interface ISetupRemainingPropsInTestEventContextOptions {
    context: ITestEventHandlerContext;
    rawDescription: string;
}

interface ITestRunnerActionContext {
    index: number;
    totalCount: number;
}

interface ITestRunnerItem {
    action: TestRunnerAction;
}

type TestRunnerAction = (rc: ITestRunnerActionContext) => Promise<void>;

function bodyToString(body: any): string {
    if (typeof body === "string") {
        return body;
    }

    if (Buffer.isBuffer(body)) {
        return body.toString("utf8");
    }

    if (isNil(body)) {
        return "";
    }

    return JSON.stringify(body);
}

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
                const {
                    controller,
                    getBody,
                    getExpectedBody,
                    getExpectedHeaders,
                    getExpectedStatus,
                    getHeaders,
                    getParameters,
                    getTimeout,
                    "index": groupIndex,
                    "name": ref,
                    method,
                    methodName
                } = options;
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
                        "action": (runnerContext) => {
                            return new Promise<void>(async (resolve, reject) => {
                                const valueGetterContext: ITestSettingValueGetterContext = {
                                };

                                let cancellationReason: Optional<CancellationReason>;
                                let isFinished = true;
                                let isTimedOut = false;
                                let onCancellationRequested: Nilable<TestEventCancellationEventHandler>;
                                const timeout = await getTimeout(valueGetterContext);
                                let to: NodeJS.Timeout | false = false;

                                const done = (failReason?: any) => {
                                    if (isFinished) {
                                        return;
                                    }
                                    isFinished = true;

                                    if (!isTimedOut && to !== false) {
                                        clearTimeout(to);
                                    }

                                    if (failReason) {
                                        reject(failReason);
                                    }
                                    else {
                                        resolve();
                                    }
                                };
                                const cancel = async (reason: CancellationReason) => {
                                    cancellationReason = reason;

                                    const cancellationEventContext: ITestEventCancellationEventHandlerContext = {
                                        reason
                                    };

                                    let failReason: any;
                                    if (reason === "timeout") {
                                        // setup with default

                                        failReason = new TimeoutError(
                                            timeout,
                                            `Test ${options.name} (${description.name}) had to be cancelled after ${timeout} ms`
                                        );
                                    }

                                    try {
                                        await onCancellationRequested?.(cancellationEventContext);
                                    }
                                    catch (error) {
                                        failReason = error;
                                    }

                                    done(new CancellationError(
                                        reason,
                                        String(
                                            failReason?.message || `Test ${options.name} (${description.name}) has been cancelled`
                                        ),
                                        failReason
                                    ));
                                };

                                try {
                                    // create object with headers with lowercase keys
                                    const headers: Record<string, string> = {};
                                    for (const [key, value] of Object.entries(await getHeaders(valueGetterContext))) {
                                        headers[key.toLowerCase().trim()] = String(value ?? "");
                                    }

                                    const body = await getExpectedBody(valueGetterContext);

                                    const parameters = await getParameters(valueGetterContext);

                                    let escapedRoute = route;
                                    for (const [paramName, paramValue] of Object.entries(parameters)) {
                                        escapedRoute = escapedRoute
                                            .split(`:${paramName}`)
                                            .join(encodeURIComponent(paramValue));
                                    }

                                    const testContext: ITestEventHandlerContext = {
                                        "body": await getBody(valueGetterContext),
                                        "cancellationReason": undefined!,
                                        "cancellationRequested": undefined!,
                                        "context": "controller",
                                        "description": undefined!,
                                        escapedRoute,
                                        "expectations": {
                                            body,
                                            "headers": await getExpectedHeaders(valueGetterContext),
                                            "status": await getExpectedStatus(valueGetterContext)
                                        },
                                        "file": controller.__file,
                                        "group": description.name,
                                        groupIndex,
                                        headers,
                                        httpMethod,
                                        "index": runnerContext.index,
                                        methodName,
                                        "onCancellationRequested": undefined,
                                        parameters,
                                        ref,
                                        route,
                                        server,
                                        "totalCount": runnerContext.totalCount,
                                        "validate": validator
                                    };

                                    // testContext.cancellationReason
                                    Object.defineProperty(testContext, "cancellationReason", {
                                        "enumerable": true,
                                        "get": () => {
                                            return cancellationReason;
                                        }
                                    });
                                    // testContext.cancellationRequested
                                    Object.defineProperty(testContext, "cancellationRequested", {
                                        "enumerable": true,
                                        "get": () => {
                                            return isTimedOut;
                                        }
                                    });
                                    // testContext.onCancellationRequested
                                    Object.defineProperty(testContext, "onCancellationRequested", {
                                        "enumerable": true,
                                        "get": () => {
                                            return onCancellationRequested;
                                        },
                                        "set": (newValue) => {
                                            if (!isNil(newValue) && typeof newValue !== "function") {
                                                throw new TypeError("newValue must be of type function");
                                            }

                                            return onCancellationRequested = asAsync<TestEventCancellationEventHandler>(newValue);
                                        }
                                    });

                                    // setup the rest of the missing
                                    // props
                                    setupRemainingPropsInTestEventContext({
                                        "context": testContext,
                                        "rawDescription": ref
                                    });

                                    // setup timeout ...
                                    to = setTimeout(() => {
                                        isTimedOut = true;

                                        cancel("timeout")
                                            .catch(done);
                                    }, timeout);
                                    // ... before start
                                    server.emit("test", testContext)
                                        .then(() => {
                                            done();
                                        })
                                        .catch(done);
                                }
                                catch (error) {
                                    done(error);
                                }
                            });
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

function setupRemainingPropsInTestEventContext(options: ISetupRemainingPropsInTestEventContextOptions) {
    const { context, rawDescription } = options;
    const { expectations, parameters } = context;

    let description = rawDescription;

    // replace placeholders with format `{{name(:value)}}`
    description = description.replace(
        /{{([^:|^}]+)(:)?([^}]*)}}/gm,
        (match: string, name: string, separator: string, value: string) => {
            name = String(name ?? "").toLowerCase().trim();
            value = String(value ?? "");

            switch (name) {
                // {{body}}
                case "body":
                    return bodyToString(expectations.body);

                // {{header:name}}
                case "header":
                    {
                        const headerName = value.toLowerCase().trim();

                        const matchingHeaderEntry = Object.entries(expectations.headers)
                            .find(([key]) => {
                                return key.toLowerCase().trim() === headerName;
                            });

                        if (matchingHeaderEntry) {
                            const expectedHeaderValue = matchingHeaderEntry[1];

                            if (expectedHeaderValue instanceof RegExp) {
                                return expectedHeaderValue.source;
                            }
                            else {
                                return expectedHeaderValue;
                            }
                        }
                    }
                    break;

                // {{parameter:name}}
                case "parameter":
                    {
                        const parameterName = value.toLowerCase().trim();

                        const matchingParameterEntry = Object.entries(parameters)
                            .find(([key]) => {
                                return key.toLowerCase().trim() === parameterName;
                            });

                        if (matchingParameterEntry) {
                            return String(matchingParameterEntry[1]);
                        }
                    }
                    break;

                // {{parameters}}
                case "parameters":
                    // example: "param1" = "param1 value", "param2" = "param2 value"
                    return Object.entries(parameters)
                        .map(([parameterName, parameterValue]) => {
                            return `"${parameterName}" = "${parameterValue}"`;
                        })
                        .join(", ");

                // {{status}}
                case "status":
                    return String(expectations.status);
            }

            return match;
        });

    context.description = description;
    context.ref = rawDescription;
}
