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

import type { HttpMethod } from "@egomobile/http-server";
import type { AnySchema } from "joi";
import type { JSONSchema4, JSONSchema6, JSONSchema7 } from "json-schema";
import type { ControllerBase } from "../index.js";
import type { Constructor, LazyValue, Nilable, ObjectKey, Optional } from "./internal.js";

/**
 * `afterAll()` function for (unit-)tests.
 *
 * @param {IAfterAllTestsContext} context The context.
 */
export type AfterAllTestsFunc = (context: IAfterAllTestsContext) => any;

/**
 * `afterEach()` function for (unit-)tests.
 *
 * @param {IAfterEachTestContext} context The context.
 */
export type AfterEachTestFunc = (context: IAfterEachTestContext) => any;

/**
 * `beforeAll()` function for (unit-)tests.
 *
 * @param {IBeforeAllTestsContext} context The context.
 */
export type BeforeAllTestsFunc = (context: IBeforeAllTestsContext) => any;

/**
 * `beforeEach()` function for (unit-)tests.
 *
 * @param {IBeforeEachTestContext} context The context.
 */
export type BeforeEachTestFunc = (context: IBeforeEachTestContext) => any;

/**
 * A controller test event listener.
 *
 * @param {IControllerTestEventListenerContext} context The context.
 */
export type ControllerTestEventListener = (context: IControllerTestEventListenerContext) => any;

/**
 * Context for a `AfterAllTestsFunc` function / method.
 */
export interface IAfterAllTestsContext {
    /**
     * The global error, if occurred.
     */
    error?: any;

    /**
     * The number of failed tests.
     */
    failCount: number;

    /**
     * The session.
     */
    session: Readonly<ITestSession>;

    /**
     * The total number of tests.
     */
    totalCount: number;
}

/**
 * Context for a `AfterEachTestFunc` function / method.
 */
export interface IAfterEachTestContext {
    /**
     * The error by single test, if occurred.
     */
    error?: any;

    /**
     * The current zero-based index.
     */
    index: number;

    /**
     * The session.
     */
    session: Readonly<ITestSession>;

    /**
     * The total number of tests.
     */
    totalCount: number;
}

/**
 * Context for a `BeforeAllTestsFunc` function / method.
 */
export interface IBeforeAllTestsContext {
    /**
     * The session.
     */
    session: Readonly<ITestSession>;
}

/**
 * Context for a `BeforeEachTestFunc` function / method.
 */
export interface IBeforeEachTestContext {
    /**
     * The current zero-based index.
     */
    index: number;

    /**
     * The session.
     */
    session: Readonly<ITestSession>;

    /**
     * The total number of tests.
     */
    totalCount: number;
}

/**
 * Describes a controller.
 */
export interface IController {
    /**
     * The instance.
     */
    controller: ControllerBase;

    /**
     * The underlying class.
     */
    controllerClass: Constructor<ControllerBase>;

    /**
     * The full path to the underlying file.
     */
    fullPath: string;

    /**
     * The relative path to the underlying file.
     */
    relativePath: string;

    /**
     * The full path of the root directory for all controllers.
     */
    rootDir: string;
}

/**
 * Context of an event, that is emitted, after a controller instance has been created.
 */
export interface IControllerCreatedEventContext {
    /**
     * The new controller.
     */
    controller: IController;
}

/**
 * Context for an `ControllerTestEventListener` function.
 */
export interface IControllerTestEventListenerContext {
    /**
     * The request body.
     */
    body: any;

    /**
     * The underlying controller.
     */
    controller: IController;

    /**
     * The expectations.
     */
    expectations: ITestSettingExpectations;

    /**
     * The request headers.
     */
    headers: Record<string, any>;

    /**
     * The URL parameters.
     */
    parameters: Record<string, string>;

    /**
     * The query parameters.
     */
    query: Record<string, string>;

    /**
     * The underlying session.
     */
    session: Readonly<ITestSession>;

    /**
     * The start time.
     */
    start: Date;

    /**
     * Custom test response validator.
     */
    validator?: Optional<TestResponseValidator>;
}

/**
 * Result of a controller test run.
 */
export interface IControllerTestResult {
    /**
     * The error, if failed.
     */
    error?: any;

    /**
     * The total number of failed tests.
     */
    failCount: number;

    /**
     * The session.
     */
    session: Readonly<ITestSession>;

    /**
     * The total number of succeeded tests.
     */
    successCount: number;
}

/**
 * Options for `IHttpServer.controllers()` method.
 */
export interface IControllersOptions {
    /**
     * Additional imports.
     */
    imports?: Nilable<ImportValues>;

    /**
     * Indicates, if default behavior of closing request connection automatically, should be
     * deactivated or not.
     */
    noAutoEnd?: Nilable<boolean>;

    /**
     * Indicates, if default behavior of automatically setup parameters, should be
     * deactivated or not.
     */
    noAutoParams?: Nilable<boolean>;

    /**
     * If `true`, do not parse query parameters automatically in this handler.
     */
    noAutoQuery?: Nilable<boolean>;

    /**
     * One or more glob patterns.
     *
     * In TypeScript environment like `ts-node`, default is `*.+(ts)`.
     * Otherwise `*.+(js)`.
     */
    patterns?: Nilable<string[]>;

    /**
     * Custom value, which indicates, that all endpoints require at least one test.
     */
    requiresTestsEverywhere?: Nilable<boolean>;

    /**
     * The custom root directory of the controller files. Relative paths will be mapped to the current working directory.
     *
     * @default "controllers"
     */
    rootDir?: Nilable<string>;
}

/**
 * Result of `IHttpServer.controllers()` method.
 */
export interface IControllersResult {
    /**
     * The new controllers.
     */
    controllers: IController[];
}

/**
 * A list of import values.
 */
export type ImportValues = Record<ObjectKey, LazyValue>;

/**
 * Options for `IHttpServer.test()` method.
 */
export interface ITestOptions {
    /**
     * Optional function, which is invoked once, after all tests have been executed.
     */
    afterAll?: Nilable<AfterAllTestsFunc>;

    /**
     * Optional function, which is invoked, after a test has been executed.
     */
    afterEach?: Nilable<AfterEachTestFunc>;

    /**
     * Optional function, which is invoked once, before the first test is being executed.
     */
    beforeAll?: Nilable<BeforeAllTestsFunc>;

    /**
     * Optional function, which is invoked, before a test is being executed.
     */
    beforeEach?: Nilable<BeforeEachTestFunc>;
}

/**
 * Context for a `TestResponseValidator` function.
 */
export interface ITestResponseValidatorContext {
    /**
     * The raw body.
     */
    body: Buffer;

    /**
     * The response headers.
     */
    headers: Record<string, string>;

    /**
     * The status code.
     */
    status: number;
}

/**
 * A test session.
 */
export interface ITestSession {
    /**
     * The end time, if available.
     */
    end?: Date;

    /**
     * If available, the occured error.
     */
    error?: any;

    /**
     * The ID of the session.
     */
    id: symbol;

    /**
     * The start time.
     */
    start: Date;
}

/**
 * Options, setting up a test.
 */
export interface ITestSettings {
    /**
     * Request body.
     */
    body?: Nilable<TestSettingValueOrGetter<any>>;

    /**
     * Sets up the expectations.
     */
    expectations?: Nilable<ITestSettingExpectations>;

    /**
     * Request headers.
     */
    headers?: Nilable<TestSettingValueOrGetter<Record<string, any>>>;

    /**
     * URL parameters.
     */
    parameters?: Nilable<TestSettingValueOrGetter<Record<string, string>>>;

    /**
     * Query parameters.
     */
    query?: Nilable<TestSettingValueOrGetter<Record<string, string>>>;

    /**
     * The reference value.
     */
    ref?: any;

    /**
     * A custom validator function.
     */
    validator?: Nilable<TestResponseValidator>;
}

/**
 * Expectations for a test.
 */
export interface ITestSettingExpectations {
    /**
     * The expected body.
     */
    body?: Nilable<TestSettingValueOrGetter<any>>;

    /**
     * The expected headers.
     */
    headers?: Nilable<TestSettingValueOrGetter<Record<string, string | RegExp>>>;

    /**
     * The expected status code.
     *
     * @default 200
     */
    status?: Nilable<TestSettingValueOrGetter<number>>;
}

/**
 * Context for a test setting value getter.
 */
export interface ITestSettingValueGetterContext {
    /**
     * The full path to the underlying file.
     */
    file: string;

    /**
     * The HTTP method.
     */
    method: HttpMethod;

    /**
     * The name of the underlying test.
     */
    name: string;

    /**
     * The raw endpoint route.
     */
    route: string;

    /**
     * The underlying settings.
     */
    settings: ITestSettings;
}

/**
 * A possible value for JSON schema.
 */
export type JsonSchema = JSONSchema4 | JSONSchema6 | JSONSchema7;

/**
 * Possible values for JSON version.
 */
export type JsonVersion = 5;

/**
 * A possible value for a schema.
 */
export type Schema = AnySchema | JsonSchema;

/**
 * A function validating a response from a test.
 *
 * @param {ITestResponseValidatorContext} context The context.
 */
export type TestResponseValidator = (context: ITestResponseValidatorContext) => any;

/**
 * A value or function, which returns a value for a test setting.
 */
export type TestSettingValueOrGetter<T extends any = any> =
    T | ((context: ITestSettingValueGetterContext) => T) | ((context: ITestSettingValueGetterContext) => PromiseLike<T>);

/**
 * A possible value for a value / item in a `.spec` file.
 */
export type TestSpecItem =
    ITestSettings |
    TestResponseValidator;

export * from "./classes/index.js";
