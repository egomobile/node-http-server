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

import crypto from "crypto";
import { AfterAllTestsFunc, AfterEachTestFunc, BeforeAllTestsFunc, BeforeEachTestFunc, CancellationError, CancellationReason, ICreateServerOptions, IHttpServer, IHttpServerTestOptions, ITestEventCancellationEventHandlerContext, ITestEventHandlerContext, ITestSession, ITestSettingValueGetterContext, TestEventCancellationEventHandler, TestResponseValidator, TimeoutError } from "..";
import { ROUTER_PATHS, TEST_DESCRIPTION, TEST_OPTIONS } from "../constants";
import type { IRouterPathItem, ITestDescription, ITestOptions, Nilable, Optional, TestOptionsGetter } from "../types/internal";
import { asAsync, compareValues, getExitWithCodeValue, isNil } from "../utils";
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
    session: ITestSession;
    totalCount: number;
}

interface ITestRunnerItem {
    action: TestRunnerAction;
    sortBy: any[];
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
    const {
        "options": serverOptions,
        server
    } = setupOptions;

    const defaultExitWithCode = getExitWithCodeValue(serverOptions?.tests?.exitCode);
    const defaultExitWithCodeOnFail = getExitWithCodeValue(serverOptions?.tests?.exitCodeOnFail);

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

    server.test = async (testOptions?: Nilable<IHttpServerTestOptions>) => {
        let failCount = 0;

        const exitWithCode = getExitWithCodeValue(testOptions?.exitCode, defaultExitWithCode);
        const exitWithCodeOnFail = getExitWithCodeValue(testOptions?.exitCodeOnFail, defaultExitWithCodeOnFail);

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
                    getQuery,
                    getTimeout,
                    "index": groupIndex,
                    "name": testName,
                    method,
                    methodName,
                    settings
                } = options;
                const validator = typeof settings.validator === "function" ?
                    asAsync<TestResponseValidator>(settings.validator) :
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
                                    "file": controller.__file,
                                    "method": httpMethod,
                                    "name": testName,
                                    route,
                                    settings
                                };

                                let cancellationReason: Optional<CancellationReason>;
                                let isFinished = false;
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
                                    const query = await getQuery(valueGetterContext);

                                    let escapedRoute = route;
                                    for (const [paramName, paramValue] of Object.entries(parameters)) {
                                        escapedRoute = escapedRoute
                                            .replaceAll(`:${paramName}`, encodeURIComponent(paramValue));
                                    }

                                    const escapedQuery = Object.entries(query)
                                        .map(([queryName, queryValue]) => {
                                            return `${encodeURIComponent(queryName)}=${encodeURIComponent(queryValue)}`;
                                        }).join("&");

                                    const testContext: ITestEventHandlerContext = {
                                        "body": await getBody(valueGetterContext),
                                        "cancellationReason": undefined!,
                                        "cancellationRequested": undefined!,
                                        "context": "controller",
                                        "countFailure": async () => {
                                            ++failCount;
                                        },
                                        "description": undefined!,
                                        escapedQuery,
                                        escapedRoute,
                                        "expectations": {
                                            body,
                                            "headers": await getExpectedHeaders(valueGetterContext),
                                            "status": await getExpectedStatus(valueGetterContext)
                                        },
                                        "file": controller.__file,
                                        "group": description.name,
                                        groupIndex,
                                        "groupTag": description.tag,
                                        headers,
                                        httpMethod,
                                        "index": runnerContext.index,
                                        methodName,
                                        "onCancellationRequested": undefined,
                                        parameters,
                                        query,
                                        "ref": settings.ref,
                                        route,
                                        server,
                                        "session": runnerContext.session,
                                        "tag": settings.tag,
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
                                        "rawDescription": testName
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
                        },
                        "sortBy": [
                            // first by group
                            isNil(description.sortOrder) ? 0 : description.sortOrder,
                            description.name.toLowerCase().trim(),

                            // then by tests
                            isNil(settings.sortOrder) ? 0 : settings.sortOrder,
                            testName.toLowerCase().trim()
                        ]
                    });
                });
            })(await getOptions());
        }

        // sort items recursive, using their
        // values in `sortBy` props
        allRunners.sort((x, y) => {
            // `x` and `y` have the same number of
            // items in their `sortBy` array (s. above)
            const sortByItemLen = x.sortBy.length;

            for (let i = 0; i < sortByItemLen; i++) {
                const compVal = compareValues(x.sortBy[i], y.sortBy[i]);
                if (compVal !== 0) {
                    return compVal;
                }
            }

            return 0;
        });

        const totalCount = allRunners.length;
        let globalError: any;

        const sessionStart = new Date();
        const sessionId = `${sessionStart.valueOf()}_${crypto.randomUUID()}`;
        const session: Readonly<ITestSession> = {
            "id": sessionId,
            "start": sessionStart
        };
        let sessionEnd!: Date;

        // global preparations
        await beforeAll({
            session,
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
                        session,
                        totalCount
                    });

                    const runner = allRunners[i];
                    const { action } = runner;

                    await action({
                        "index": i,
                        session,
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
                        session,
                        totalCount
                    });
                }
            }

            sessionEnd = new Date();
        }
        catch (error) {
            sessionEnd = new Date();

            globalError = error;
        }
        finally {
            // global cleanups
            await afterAll({
                "error": globalError,
                failCount,
                "session": {
                    ...session,

                    "end": sessionEnd
                },
                totalCount
            });
        }

        if (failCount) {
            if (exitWithCodeOnFail !== false) {
                process.exit(exitWithCodeOnFail);
            }
        }
        else {
            if (exitWithCode !== false) {
                process.exit(exitWithCode);
            }
        }

        return {
            "error": globalError,
            failCount
        };
    };
}

function setupRemainingPropsInTestEventContext(options: ISetupRemainingPropsInTestEventContextOptions) {
    const { context, rawDescription } = options;
    const { expectations, parameters, query } = context;

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

                // {{query}}
                case "query":
                    // example: "queryParam1" = "queryParam1 value", "queryParam2" = "queryParam2 value"
                    return Object.entries(query)
                        .map(([queryName, queryValue]) => {
                            return `"${queryName}" = "${queryValue}"`;
                        })
                        .join(", ");

                // {{query-parameter:name}}
                case "query-parameter":
                    {
                        const queryParameterName = value.toLowerCase().trim();

                        const matchingQueryParameterEntry = Object.entries(query)
                            .find(([key]) => {
                                return key.toLowerCase().trim() === queryParameterName;
                            });

                        if (matchingQueryParameterEntry) {
                            return String(matchingQueryParameterEntry[1]);
                        }
                    }
                    break;

                // {{status}}
                case "status":
                    return String(expectations.status);
            }

            return match;
        });

    // readonly is only for the interface declaration
    (context as any).description = description;
}
