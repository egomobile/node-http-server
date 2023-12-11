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

import type { ErrorObject as AjvError } from "ajv";
import type { IncomingMessage, ServerResponse } from "http";
import type { AnySchema, ValidationError as JoiValidationError } from "joi";
import type { JSONSchema4, JSONSchema6, JSONSchema7 } from "json-schema";
import type { OpenAPIV3 } from "openapi-types";
import type { URLSearchParams } from "url";
import type { middleware } from "..";
import type { ParseError } from "../errors/parse";
import type { Constructor, Func, Nilable, ObjectKey, Optional, PartialBy } from "./internal";

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
 * An 'authorize' argument value.
 */
export type AuthorizeArgumentValue = AuthorizeOptionArgument1 | AuthorizeRoles;

/**
 * A function, that provides an authorized user, if possible.
 *
 * @returns {Nilable<IAuthorizedUser>|Promise<Nilable<IAuthorizedUser>>} The result with the authorized user, if possible.
 */
export type AuthorizedUserProvider =
    (context: IAuthorizedUserProviderContext) => Nilable<IAuthorizedUser> | Promise<Nilable<IAuthorizedUser>>;

/**
 * Is invoked, when authorize fails.
 *
 * @param {any} reason The reason.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpRequest} response The request context.
 */
export type AuthorizeValidationFailedHandler =
    (reason: any, request: IHttpRequest, response: IHttpResponse) => any;

/**
 * An argument for authorize options.
 */
export type AuthorizeOptionArgument1 = AuthorizeValidatorValue | IAuthorizeOptions;

/**
 * A function, that provides 'authorize' roles.
 */
export type AuthorizeRolesProvider =
    (context: IControllersAuthorizeRoleProviderContext) => AuthorizeRoles | Promise<AuthorizeRoles>;

/**
 * Possible values for 'authorize' rules.
 */
export type AuthorizeRoles = any[];

/**
 * A value, that provides 'authorize' roles.
 */
export type AuthorizeRolesValue = AuthorizeRoles | AuthorizeRolesProvider;

/**
 * A validator for 'authorize' actions.
 *
 * @param {IAuthorizeValidatorContext} context The context.
 *
 * @returns {any} A result, that indicates if request is authorized or not.
 */
export type AuthorizeValidator = (context: IAuthorizeValidatorContext) => any;

/**
 *  A validator for 'authorize' actions.
 */
export type AuthorizeValidatorValue = AuthorizeValidator | string;

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
 * Possible and known values for a cancellation.
 */
export type CancellationReason = "timeout";

/**
 * A function, that is invoked after a controller has been
 * created, initialized and added to the context.
 *
 * @param {IControllerInitializedEventArguments} args The arguments.
 */
export type ControllerInitializedEventHandler = (args: IControllerInitializedEventArguments) => any;

/**
 * A function, that is invoked after a controller method has been
 * created, initialized and added to the context.
 *
 * @param {IControllerMethodInitializedEventArguments} args The arguments.
 */
export type ControllerMethodInitializedEventHandler = (args: IControllerMethodInitializedEventArguments) => any;

/**
 * Format for controller URL parameters.
 */
export enum ControllerParameterFormat {
    /**
     * Default: `@my_parameter`
     */
    Default = "default",
    /**
     * Next.js: `[my_parameter]`
     */
    NextJS = "next_js"
}

/**
 * A possible value for `IControllersSwaggerOptions.operations` property.
 *
 * `false` indicates to generate no auto operation ID by this module.
 */
export type ControllersSwaggerOperationOptionsValue = IControllersSwaggerOperationOptions | false;

/**
 * A possible value for a first argument of a HTTP method / controller route decorator
 * like GET() or POST().
 */
export type ControllerRouteArgument1<TOptions extends IControllerRouteOptions = IControllerRouteOptions>
    = number | string | AnySchema | TOptions | HttpMiddleware[];

/**
 * A possible value for a second argument of a HTTP method / controller route decorator
 * like GET() or POST().
 */
export type ControllerRouteArgument2
    = AnySchema | HttpMiddleware[] | number | Nilable<HttpInputDataFormat> | Schema;

/**
 * A possible value for a third argument of a HTTP method / controller route decorator
 * like GET() or POST().
 */
export type ControllerRouteArgument3 = number;

/**
 * A possible value for `IControllerRouteOptions.deprecated`.
 */
export type ControllerRouteDeprecatedValue =
    boolean |
    IControllerRouteDeprecatedOptions;

/**
 * A possible value for a path of a controller route.
 */
export type ControllerRoutePath = string;

/**
 * Possible values for controller router decorators with bodies.
 */
export type ControllerRouteWithBodyOptions =
    IControllerRouteWithBodyAndJoiSchemaOptions |
    IControllerRouteWithBodyAndJsonSchemaOptions |
    IControllerRouteWithBodyAndNoSchemaOptions;

/**
 * Base document of an 'IControllersSwaggerOptions' object.
 */
export type ControllersSwaggerBaseDocument = Pick<Pick<OpenAPIV3.Document, Exclude<keyof OpenAPIV3.Document, "paths">>, Exclude<keyof Pick<OpenAPIV3.Document, Exclude<keyof OpenAPIV3.Document, "paths">>, "openapi">>;

/**
 * Possible values for Swagger options for controllers.
 */
export type ControllersSwaggerOptionsValue = IControllersSwaggerOptions | false;

/**
 * A method / function, that updates the documentation of a route / controller method, e.g.
 */
export type DocumentationUpdaterHandler = (context: IDocumentationUpdaterContext) => any;

/**
 * A possible value, indicating, with what code a process should be exited.
 *
 * `false` indicate NOT to exit the process.
 */
export type ExitWithCodeValue = number | false;

/**
 * Returns a status code from an error object.
 *
 * @param {any} error The error object.
 *
 * @returns {number} The status code.
 */
export type GetStatusCodeFromError = (error: any) => number;

/**
 * A HTTP error handler.
 *
 * @param {any} error The error.
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export type HttpErrorHandler = (error: any, request: IncomingMessage, response: ServerResponse) => any;

/**
 * The format of the input data of a HTTP request.
 */
export enum HttpInputDataFormat {
    /**
     * Binary.
     */
    Binary = 1,
    /**
     * JSON
     */
    JSON = 2,
}

/**
 * A possible value for a HTTP method.
 */
export type HttpMethod = "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

/**
 * A middleware.
 *
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 * @param {NextFunction} next The next function.
 */
export type HttpMiddleware = (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => any;

/**
 * A 'not found' handler.
 *
 * @param {IncomingMessage} request The request context.
 * @param {ServerResponse} response The response context.
 */
export type HttpNotFoundHandler = (request: IncomingMessage, response: ServerResponse) => any;

/**
 * Request handler options or one or more middleware(s).
 */
export type HttpOptionsOrMiddlewares = IHttpRequestHandlerOptions | HttpMiddleware | HttpMiddleware[];

/**
 * Validates a request path.
 *
 * @param {IncomingMessage} request The request context.
 *
 * @returns {boolean|PromiseLike<boolean>} A value, which indicates, that path does match or not.
 */
export type HttpPathValidator = (request: IncomingMessage) => boolean | PromiseLike<boolean>;

/**
 * A request handler.
 *
 * @param {IHttpResponse} request The request context.
 * @param {Response} response The response context.
 */
export type HttpRequestHandler = (request: IHttpRequest, response: IHttpResponse) => any;

/**
 * A possible value for a request path.
 */
export type HttpRequestPath = string | RegExp | HttpPathValidator;

/**
 * Information about an authorized user.
 */
export interface IAuthorizedUser {
    /**
     * The roles of the user.
     */
    roles: AuthorizeRoles;
}

/**
 * Context for 'AuthorizedUserProvider'.
 */
export interface IAuthorizedUserProviderContext {
    /**
     * The underlying request.
     */
    request: IHttpRequest;
}

/**
 * Context for a `AfterAllTestsFunc` function / method.
 */
export interface IAfterAllTestsContext {
    /**
     * The global error, if occurred.
     */
    readonly error?: any;
    /**
     * The number of failed tests.
     */
    readonly failCount: number;
    /**
     * The underlying session.
     */
    readonly session: Readonly<ITestSession>;
    /**
     * The total number of tests.
     */
    readonly totalCount: number;
}

/**
 * Context for a `AfterEachTestFunc` function / method.
 */
export interface IAfterEachTestContext {
    /**
     * The error by single test, if occurred.
     */
    readonly error?: any;
    /**
     * The current zero-based index.
     */
    readonly index: number;
    /**
     * The underlying session.
     */
    readonly session: Readonly<ITestSession>;
    /**
     * The total number of tests.
     */
    readonly totalCount: number;
}

/**
 * Options for an 'authorize' decorator or prop.
 */
export interface IAuthorizeOptions {
    /**
     * A function, which tries to find a user for the current request.
     */
    findAuthorizedUser?: Nilable<AuthorizedUserProvider>;
    /**
     * Is invoked, when validationf failes.
     */
    onValidationFailed?: Nilable<AuthorizeValidationFailedHandler>;
    /**
     * The available roles to use, or the function that provide it.
     */
    roles?: Nilable<AuthorizeRolesValue>;
    /**
     * A custom function to setup an 'authorize' middleware.
     */
    setupMiddleware?: Nilable<SetupAuthorizeMiddlewareHandler>;
    /**
     * A list of custom middlewares to add BEFORE the authorize middleware.
     */
    use?: Nilable<HttpMiddleware[]>;
    /**
     * The custom validator to use.
     */
    validator?: Nilable<AuthorizeValidatorValue>;
}

/**
 * A context for a ''.
 */
export interface IAuthorizeValidatorContext {
    /**
     * The request context.
     */
    request: IHttpRequest;
    /**
     * The response context.
     */
    response: IHttpResponse;
    /**
     * List of roles.
     */
    roles: AuthorizeRoles;
}

/**
 * Context for a `BeforeAllTestsFunc` function / method.
 */
export interface IBeforeAllTestsContext {
    /**
     * The underlying session.
     */
    readonly session: Readonly<ITestSession>;
    /**
     * The total number of tests.
     */
    readonly totalCount: number;
}

/**
 * Context for a `BeforeEachTestFunc` function / method.
 */
export interface IBeforeEachTestContext {
    /**
     * The current zero-based index.
     */
    readonly index: number;
    /**
     * The underlying session.
     */
    readonly session: Readonly<ITestSession>;
    /**
     * The total number of tests.
     */
    readonly totalCount: number;
}

/**
 * Options for the first argument of a `ControllerInitializedEventHandler`.
 */
export interface IControllerInitializedEventArguments {
    /**
     * The underlying server instance.
     */
    app: IHttpServer;
    /**
     * The underlying controller instance.
     */
    controller: any;
    /**
     * The class of instance in `controller`.
     */
    controllerClass: Constructor<any>;
    /**
     * The full path of the underlying file.
     */
    fullPath: string;
    /**
     * The relative path of the underlying file.
     */
    relativePath: string;
}

/**
 * Information about a loaded controller method.
 */
export interface IControllerMethodInfo {
    /**
     * The underlying controller.
     */
    controller: IHttpController;
    /**
     * Deprecated options.
     */
    deprecatedOptions: IControllerRouteDeprecatedOptions;
    /**
     * The underlying base function instance.
     */
    function: Func;
    /**
     * The underlying handler function for the server, which is used at the end.
     */
    handler: Func;
    /**
     * The underlying http method.
     */
    method: HttpMethod;
    /**
     * The middlewares.
     */
    middlewares: HttpMiddleware[];
    /**
     * The name of the method.
     */
    name: string;
    /**
     * The underlying options.
     */
    options: Optional<IControllerRouteOptions | ControllerRouteWithBodyOptions>;
    /**
     * The route path.
     */
    path: HttpRequestPath;
    /**
     * The raw request path as string.
     */
    rawPath: string;
    /**
     * The serializer, if defined.
     */
    serializer: Optional<ResponseSerializer>;
    /**
     * Underlying swagger operations.
     */
    swaggerOperations: OpenAPIV3.OperationObject[];
    /**
     * Tests, represented by their settings.
     */
    tests: ITestSettings[];
}

/**
 * Options for the first argument of a `ControllerMethodInitializedEventHandler`.
 */
export interface IControllerMethodInitializedEventArguments {
    /**
     * The underlying server instance.
     */
    app: IHttpServer;
    /**
     * The underlying controller instance.
     */
    controller: any;
    /**
     * The class of instance in `controller`.
     */
    controllerClass: Constructor<any>;
    /**
     * The full path of the underlying file.
     */
    fullPath: string;
    /**
     * The underlying method instance.
     */
    function: Func;
    /**
     * The information about the HTTP methods, which are registrated for this method.
     */
    methods: IControllerMethodInfo[];
    /**
     * The name of the property inside the class, where `method`is used.
     */
    name: string;
    /**
     * The relative path of the underlying file.
     */
    relativePath: string;
}

/**
 * Options for handling a deprecated status.
 */
export interface IControllerRouteDeprecatedOptions {
    /**
     * Append middlewares instead of prepend them.
     *
     * @default `false`
     */
    appendMiddlewares?: Nilable<boolean>;
    /**
     * Indicates if route is deprecated or not.
     *
     * @default `true`
     */
    isDeprecated?: Nilable<boolean>;
    /**
     * A custom middleware, that may tell a client that the endpoint is deprecated
     * and/or logs access.
     *
     * The default behavior is, that the server will return a simple 410 HTTP response.
     */
    onDeprecated?: Nilable<HttpMiddleware>;
    /**
     * One or more middlewares, that is added before `onDeprecated`, but only for the
     * case that `isDeprecated` is activated.
     */
    use?: Nilable<HttpMiddleware | HttpMiddleware[]>;
}

/**
 * Options for a controller route without a body.
 */
export interface IControllerRouteOptions {
    /**
     * Custom 'authorize' options.
     */
    authorize?: Nilable<AuthorizeArgumentValue>;
    /**
     * Indicates, if route is deprecated or not.
     */
    deprecated?: Nilable<ControllerRouteDeprecatedValue>;
    /**
     * Optional Swagger documentation.
     */
    documentation?: Nilable<OpenAPIV3.OperationObject>;
    /**
     * Indicates, that query parameters should NOT be parsed.
     */
    noQueryParams?: Nilable<boolean>;
    /**
     * The custom error handler.
     */
    onError?: Nilable<HttpErrorHandler>;
    /**
     * The handler, that is executed, when object validation with Swagger documentation failed.
     */
    onValidationWithDocumentationFailed?: Nilable<JsonSchemaValidationFailedHandler>;
    /**
     * The custom URL parameter format (only for the route).
     *
     * @default: `ControllerParameterFormat.Default`
     */
    parameterFormat?: Nilable<ControllerParameterFormat>;
    /**
     * The custom path.
     */
    path?: Nilable<ControllerRoutePath>;
    /**
     * The custom serializer.
     */
    serializer?: Nilable<ResponseSerializer>;
    /**
     * One or more middlewares for the route.
     */
    use?: Nilable<HttpMiddleware | HttpMiddleware[]>;
    /**
     * Validate request data with schema in `documentation` or not.
     *
     * @default false
     */
    validateWithDocumentation?: Nilable<boolean>;
}

/**
 * Options for a controller route with a body.
 */
export interface IControllerRouteWithBodyAndNoSchemaOptions extends IControllerRouteOptions {
    /**
     * The expected data of the input format.
     */
    format?: Nilable<HttpInputDataFormat>;
    /**
     * The limit in bytes for the input data.
     *
     * If that value is defined, but no schema, the input data will be downloaded
     * and written as Buffer using 'buffer()' middleware.
     */
    limit?: Nilable<number>;
    /**
     * Custom parse error handler.
     */
    onParsingFailed?: Nilable<ParseErrorHandler>;
    /**
     * Custom schema validation error handler.
     */
    onValidationFailed?: Nilable<SchemaValidationFailedHandler | ValidationFailedHandler>;
    /**
     * An optional schema to use for the validation.
     */
    schema?: Nilable<Schema>;
}

/**
 * Options for a controller route with a body, which validates with a Joi schema.
 */
export interface IControllerRouteWithBodyAndJoiSchemaOptions extends IControllerRouteWithBodyAndNoSchemaOptions {
    /**
     * @inheritdoc
     */
    onValidationFailed?: Nilable<ValidationFailedHandler>;
    /**
     * @inheritdoc
     */
    schema: Nilable<AnySchema>;
}

/**
 * Options for a controller route with a body, which validates with a JSON schema.
 */
export interface IControllerRouteWithBodyAndJsonSchemaOptions extends IControllerRouteWithBodyAndNoSchemaOptions {
    /**
     * @inheritdoc
     */
    onValidationFailed?: Nilable<SchemaValidationFailedHandler>;
    /**
     * @inheritdoc
     */
    schema: Nilable<JsonSchema>;
}

/**
 * Context for a 'ControllersAuthorizeRoleProvider' function.
 */
export interface IControllersAuthorizeRoleProviderContext {
    /**
     * The request context.
     */
    request: IHttpRequest;
}

/**
 * Describes the object for 'authorize' prop of 'IControllersOptions' interface.
 */
export interface IControllersAuthorizeOptions {
    /**
     * A default function, which tries to find a user for the current request.
     */
    findAuthorizedUser?: Nilable<AuthorizedUserProvider>;
    /**
     * Is invoked, when validationf failes.
     */
    onValidationFailed?: Nilable<AuthorizeValidationFailedHandler>;
    /**
     * A custom, global function to setup an 'authorize' middleware.
     */
    setupMiddleware?: Nilable<SetupAuthorizeMiddlewareHandler>;
    /**
     * A list of custom middlewares to add BEFORE the authorize middleware.
     */
    use?: Nilable<HttpMiddleware[]>;
    /**
     * The default validator.
     */
    validator?: Nilable<AuthorizeValidatorValue>;
}

/**
 * Options for 'controllers()' method of 'IHttpServer' instance.
 */
export interface IControllersOptions {
    /**
     * Custom value, which indicates, that, if empty settings are allowed or not.
     */
    allowEmptyTestSettings?: Nilable<boolean>;
    /**
     * Options for 'authorize' feature.
     */
    authorize?: Nilable<IControllersAuthorizeOptions>;
    /**
     * List of (value) imports.
     */
    imports?: Nilable<ImportValues>;
    /**
     * Tries to load endpoint documentation from `.openapi` files.
     *
     * @default true
     */
    loadOpenAPIFiles?: Nilable<boolean>;
    /**
     * Default value, that indicates, that query parameters should NOT be parsed.
     */
    noQueryParams?: Nilable<boolean>;
    /**
     * An optional function, that is invoked after a controller
     * has been created, initialized and added to the context.
     */
    onControllerInitialized?: Nilable<ControllerInitializedEventHandler>;
    /**
     * An optional function, that is invoked after a controller method
     * has been created, initialized and added to the context.
     */
    onControllerMethodInitialized?: Nilable<ControllerMethodInitializedEventHandler>;
    /**
     * Default parse error handler.
     */
    onParsingFailed?: Nilable<ParseErrorHandler>;
    /**
     * Default schema validation error handler.
     */
    onSchemaValidationFailed?: Nilable<ValidationFailedHandler>;
    /**
     * An optional function, that is invoked after a Swagger documentation
     * has been loaded, initialized and added to the context.
     */
    onSwaggerInitialized?: Nilable<SwaggerInitializedEventHandler>;
    /**
     * The default handler, that is executed, when object validation with Swagger documentation failed.
     */
    onValidationWithDocumentationFailed?: Nilable<JsonSchemaValidationFailedHandler>;
    /**
     * The custom URL parameter format.
     *
     * @default: `ControllerParameterFormat.Default`
     */
    parameterFormat?: Nilable<ControllerParameterFormat>;
    /**
     * The custom file patterns.
     *
     * @see https://www.npmjs.com/package/minimatch
     */
    patterns?: Nilable<string | string[]>;
    /**
     * Value, which indicates, if all endpoints should have documentation or not.
     *
     * @default true
     */
    requiresDocumentationEverywhere?: Nilable<boolean>;
    /**
     * Custom value, which indicates, that, if no settings are specified, a module file with it is required.
     */
    requiresTestModuleAsDefault?: Nilable<boolean>;
    /**
     * Custom value, which indicates, that all endpoints require at least one test.
     */
    requiresTestsEverywhere?: Nilable<boolean>;
    /**
     * The custom root directory.
     *
     * @default "controllers"
     */
    rootDir?: Nilable<string>;
    /**
     * Options to setup Swagger UI.
     */
    swagger?: Nilable<ControllersSwaggerOptionsValue>;
    /**
     * Custom value for a (default) timeout for tests, in ms.
     *
     * @default 5000
     */
    testTimeout?: Nilable<number>;
    /**
     * Default, which indicates, to validate request data with schema in `documentation` prop
     * of a request decorator like `@GET()` or `@POST()` or not.
     *
     * @default false
     */
    validateWithDocumentation?: Nilable<boolean>;
}

/**
 * Result of an `IHttpServer.controllers()` call.
 */
export interface IControllersResult {
    /**
     * The underlying app / server.
     */
    app: IHttpServer;
    /**
     * The swagger documentation.
     */
    documentation: OpenAPIV3.Document;
    /**
     * Indicates if Swagger UI is enabled or not.
     */
    isSwaggerUIEnabled: boolean;
    /**
     * Controller methods.
     */
    methods: IControllerMethodInfo[];
}

/**
 * Settings for Swagger operations and their IDs.
 */
export interface IControllersSwaggerOperationOptions {
    /**
     * Custom template for the IDs.
     *
     * Supports following variables:
     * - `{{class}}`: Name of the controller class, like `MyHttpController`
     * - `{{file}}`: Base name of the file (without extension), like `index`
     * - `{{http-method}}`: `get`, `post`, `patch`, etc.
     * - `{{method}}`: Name of the controller method, like `getAllUsers`
     *
     * @default: `{{http-method}}-{{class}}-{{method}}`
     */
    idTemplate?: Nilable<string>;
    /**
     * Indicates to use no automatic generated operation IDs.
     *
     * @default `false`
     */
    noAutoIds?: Nilable<boolean>;
}

/**
 * Swagger options for controllers.
 */
export interface IControllersSwaggerOptions {
    /**
     * The base path.
     *
     * @default "/swagger"
     */
    basePath?: Nilable<string>;
    /**
     * The base document.
     */
    document: ControllersSwaggerBaseDocument;
    /**
     * Do not provide `document` as JSON file download.
     */
    noJSON?: Nilable<boolean>;
    /**
     * Do not provide `document` as YAML file download.
     */
    noYAML?: Nilable<boolean>;
    /**
     * Anything about handling operations and their IDs in Swagger documentations.
     */
    operations?: Nilable<ControllersSwaggerOperationOptionsValue>;
    /**
     * The path to the resource files / modules.
     * Relative paths will be mapped to the controller root directory.
     */
    resourcePath?: Nilable<string>;
    /**
     * One or more required middleware for the Swagger endpoint(s).
     */
    use?: Nilable<HttpMiddleware[]>;
}

/**
 * Context of a method, that updates the documentation of a route / controller method.
 */
export interface IDocumentationUpdaterContext {
    /**
     * The underlying documentation.
     */
    documentation: OpenAPIV3.OperationObject;
    /**
      * Indicates if endpoint does validate data with a schema or not.
      */
    doesValidate: boolean;
    /**
      * Indicates if endpoint does validate query data with a schema or not.
      */
    doesValidateQuery: boolean;
    /**
      * Indicates if underlying method is marked with 'Authorize()' decorator or not.
      */
    hasAuthorize: boolean;
    /**
     * The HTTP method.
     */
    method: Uppercase<HttpMethod>;
    /**
      * The middlewares, which are defined for that route.
      */
    middlewares: HttpMiddleware[];
    /**
     * The path of the route.
     */
    path: HttpRequestPath;
}

/**
 * Information about an existing and authorized user.
 */
export interface IExistingAndAuthorizedUser {
    /**
     * The roles of the user.
     */
    roles: AuthorizeRoles;
}

/**
 * Options for a body parser function.
 */
export interface IHttpBodyParserOptions {
    /**
     * Defines the maximum size of the body, in bytes.
     * (null) indicates to use NO limit
     */
    limit?: Nilable<number>;
    /**
     * A custom handler, to tell the client, that the body is too big.
     */
    onLimitReached?: Nilable<HttpRequestHandler>;
    /**
     * A custom handler, to tell the client, that the body could not be parsed.
     */
    onParsingFailed?: Nilable<ParseErrorHandler>;
}

/**
 * A HTTP controller.
 */
export interface IHttpController<TApp extends any = IHttpServer> {
    /**
     * The underlying app instance.
     */
    readonly __app: TApp;
    /**
     * The full path of the underlying file.
     */
    readonly __file: string;
    /**
     * The relative path of the underlying file.
     */
    readonly __path: string;
}

/**
 * Options for a controller instance.
 */
export interface IHttpControllerOptions<TApp extends any = IHttpServer> {
    /**
     * The underlying app.
     */
    app: TApp;
    /**
     * The full path of the underlying file.
     */
    file: string;
    /**
     * The relative path of the underlying file.
     */
    path: string;
}

/**
 * Options for a request handler.
 */
export interface IHttpRequestHandlerOptions {
    /**
     * Automatic call `end()` method on response context
     * when handler was executed successfully.
     *
     * @default true
     */
    autoEnd?: Optional<boolean>;
    /**
     * A list of one or more middlewares.
     */
    use?: Nilable<HttpMiddleware[]>;
}

/**
 * A HTTP request.
 */
export interface IHttpRequest<TBody extends any = any> extends IncomingMessage {
    /**
     * The body, if parsed.
     */
    body?: Optional<TBody>;
    /**
     * List of cookies, if parsed.
     */
    cookies?: Optional<Record<string, string>>;
    /**
     * The current language, if parsed.
     */
    lang?: Nilable<string>;
    /**
     * List of query parameters, if parsed.
     */
    query?: Optional<URLSearchParams>;
}

/**
 * A HTTP response.
 */
export interface IHttpResponse extends ServerResponse {
}

/**
 * A HTTP server instance.
 */
export interface IHttpServer {
    /**
     * A HTTP server itself is a HTTP request listener,
     * which can be used in any compatible server instance, like
     * Node HTTP, e.g.
     *
     * @example
     * ```
     * import createServer from '@egomobile/http-server'
     * import { createServer as createHTTPServer } from 'http'
     *
     * const app = createServer()
     * const server = createHTTPServer(app)
     *
     * server.listen(8080, () => {
     *   console.log('Server is listing')
     * })
     * ```
     */
    (request: IncomingMessage, response: ServerResponse): void;

    /**
     * Registers a route for all possible request methods.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.all('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    all(path: HttpRequestPath, handler: HttpRequestHandler): this;
    all(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Closes / stops the server.
     *
     * @example
     * ```
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * await app = server.listen()
     * console.log('Server is listening')
     *
     * setTimeout(() => {
     *     app.close().catch(console.error)
     * }, 60000)
     * ```
     */
    close(): Promise<void>;

    /**
     * Registers a route for a CONNECT request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.connect('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    connect(path: HttpRequestPath, handler: HttpRequestHandler): this;
    connect(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Loads an initializes the controllers from and inside a root directory.
     *
     * @example
     * ```
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * // scans the subdirectory 'controllers' of the current process'
     * // working directory for JavaScript and/or TypeScript files,
     * // which do not start with _ and have a class as default export,
     * // that is marked with @Controller decorator
     * // and creates instances from that classes, which will be automatically
     * // mapped as handlers for 'app' instance
     * app.controllers()
     *
     * await app.listen()
     * ```
     *
     * @param {Nilable<string>} [rootDir] The custom root directory.
     * @param {Nilable<ImportValues>} [imports] Values to import.
     * @param {Nilable<IControllersOptions>} [options] Custom options.
     *
     * @returns {IControllersResult} The result of the invocation with call data of the setup.
     */
    controllers(): IControllersResult;
    controllers(rootDir: Nilable<string>, imports?: Nilable<ImportValues>): IControllersResult;
    controllers(options: Nilable<IControllersOptions>): IControllersResult;

    /**
     * Registers a route for a DELETE request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.delete('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    delete(path: HttpRequestPath, handler: HttpRequestHandler): this;
    delete(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Emits an event.
     *
     * @param {string} event The name of the event to emit.
     * @param {any[]} [args] One or more argument for the event.
     *
     * @returns {any} The result.
     */
    emit(event: "test", context: ITestEventHandlerContext): Promise<any>;

    /**
     * Gets the current error handler.
     */
    readonly errorHandler: HttpErrorHandler;

    /**
     * Registers a route for a GET request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.get('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    get(path: HttpRequestPath, handler: HttpRequestHandler): this;
    get(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a HEAD request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.head('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    head(path: HttpRequestPath, handler: HttpRequestHandler): this;
    head(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * The underlying low-level server instance, which is only available
     * if server is listening, otherwise it is `null`.
     *
     * Mostly this is a `Server` instance from `http` module.
     */
    readonly instance: any;

    /**
     * Indicates if that instance is an e.GO HTTP server.
     *
     * @example
     * ```
     * import assert from 'assert'
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * assert.strictEqual(app.isEgoHttpServer, true)
     * ```
     */
    readonly isEgoHttpServer: true;

    /**
     * Starts listening for connections.
     *
     * @param {Nilable<number|string>} [port] The custom TCP port.
     *                                        Default is 8080 in development mode (NODE_ENV), otherwise 80.
     *
     * @example
     * ```
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * await app.listen()  // if NODE_ENV === 'development', port is 8080
     *                     // otherwise port is 80
     *
     * await app.listen(5979)  // explicit port 5979
     * ```
     */
    listen(port?: Nilable<number | string>): Promise<void>;

    /**
     * Gets the current "not found" handler.
     */
    readonly notFoundHandler: HttpNotFoundHandler;

    /**
     * Registers an event handler.
     *
     * @param {string} event The name of the event.
     * @param {TestEventHandler} handler The handler to execute.
     */
    on(event: "test", handler: TestEventHandler): this;

    /**
     * Registers a route for a OPTIONS request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.options('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    options(path: HttpRequestPath, handler: HttpRequestHandler): this;
    options(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a PATCH request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.patch('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    patch(path: HttpRequestPath, handler: HttpRequestHandler): this;
    patch(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * The current TCP port or (undefined) if server is not running.
     */
    readonly port?: Optional<number>;

    /**
     * Registers a route for a POST request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.post('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    post(path: HttpRequestPath, handler: HttpRequestHandler): this;
    post(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Registers a route for a PUT request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.put('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    put(path: HttpRequestPath, handler: HttpRequestHandler): this;
    put(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Sets a custom error handler.
     *
     * @param {HttpErrorHandler} handler The new handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.setErrorHandler(async (error: any, request: IHttpRequest, response: IHttpResponse) => {
     *     const errorMessage = Buffer.from('SERVER ERROR: ' + String(error))
     *
     *     if (!response.headersSent) {
     *         response.writeHead(500, {
     *             'Content-Length': String(errorMessage.length)
     *         })
     *     }
     *
     *     response.write(errorMessage)
     *     response.end()
     * })
     *
     * app.get('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     throw new Error('Something went wrong')
     * })
     *
     * await app.listen()
     * ```
     *
     * @returns {this}
     */
    setErrorHandler(handler: HttpErrorHandler): this;

    /**
     * Sets a new 'not found' handler.
     *
     * @param {HttpNotFoundHandler} handler The new handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.setNotFoundHandler(async (request: IHttpRequest, response: IHttpResponse) => {
     *     const errorMessage = Buffer.from(`The page ${request.url} could not be found`)
     *
     *     if (!response.headersSent) {
     *         response.writeHead(404, {
     *             'Content-Length': String(errorMessage.length)
     *         })
     *     }
     *
     *     response.write(errorMessage)
     *     response.end()
     * })
     *
     * // ... your routes
     *
     * await app.listen()
     * ```
     *
     * @returns {this}
     */
    setNotFoundHandler(handler: HttpNotFoundHandler): this;

    /**
     * Runs tests.
     *
     * @param {Nilable<IHttpServerTestOptions>} [options] Custom options.
     *
     * @returns {Promise<IHttpServerTestResult>} The promise with the result.
     */
    test(options?: Nilable<IHttpServerTestOptions>): Promise<IHttpServerTestResult>;

    /**
     * Registers a route for a TRACE request.
     *
     * @param {HttpRequestPath} path The path.
     * @param {OptionsOrMiddlewares} optionsOrMiddlewares The options or middlewares for the handler.
     * @param {HttpRequestHandler} handler The handler.
     *
     * @example
     * ```
     * import createServer, { IHttpRequest, IHttpResponse } from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * app.trace('/', async (request: IHttpRequest, response: IHttpResponse) => {
     *     // do your magic here
     * })
     *
     * await app.listen()  // port === 8080, if NODE_ENV === 'development'; otherwise 80
     * ```
     */
    trace(path: HttpRequestPath, handler: HttpRequestHandler): this;
    trace(path: HttpRequestPath, optionsOrMiddlewares: HttpOptionsOrMiddlewares, handler: HttpRequestHandler): this;

    /**
     * Adds one or more global middlewares.
     *
     * @param {Middleware[]} [middlewares] The middlewares to add.
     *
     * @returns {this}
     *
     * @example
     * ```
     * import assert from 'assert'
     * import createServer from '@egomobile/http-server'
     *
     * const app = createServer()
     *
     * assert.strictEqual(app.isEgoHttpServer, true)
     *
     * app.use(async (request: any, response: any, next) => {
     *     request.foo = '1'
     *     next()
     * }, async (request: any, response: any, next) => {
     *     // foo is currently '1'
     *     request.foo += 2
     *     next()
     * })
     *
     * app.get('/', async (request: any, response: any) => {
     *     response.write(String(request.foo === '12'))
     * })
     * ```
     */
    use(...middlewares: HttpMiddleware[]): this;
}

/**
 * Custom options for `IHttpServer.test()` method.
 */
export interface IHttpServerTestOptions {
    /**
     * Custom value for the exit code, which should be used
     * if process should be exited automatically after
     * tests run successfully.
     */
    exitCode?: Nilable<ExitWithCodeValue>;
    /**
     * Custom value for the exit code, which should be used
     * if process should be exited automatically after
     * tests run with errors.
     */
    exitCodeOnFail?: Nilable<ExitWithCodeValue>;
}

/**
 * Result of `IHttpServer.test()` method.
 */
export interface IHttpServerTestResult {
    /**
     * If occurred, the global error.
     */
    error?: any;
    /**
     * The total number of failed tests.
     */
    failCount: number;
}

/**
 * Options for a body parser function, that works with string data.
 */
export interface IHttpStringBodyParserOptions extends IHttpBodyParserOptions {
    /**
     * The custom string encoding to use.
     *
     * @default "utf8"
     */
    encoding?: Nilable<BufferEncoding>;
}

/**
 * A list of import values.
 */
export type ImportValues = Record<ObjectKey, LazyImportValue>;

/**
 * A error item for a `JsonSchemaValidationFailedHandler` handler.
 */
export interface IJsonSchemaError {
    /**
     * The error code.
     */
    errorCode: string;
    /**
     * The location.
     */
    location: string;
    /**
     * The message.
     */
    message: string;
    /**
     * The path.
     */
    path: string;
}

/**
 * Context for an execution of a `ParameterDataTransformer` function.
 */
export interface IParameterDataTransformerContext {
    /**
     * The key inside the source.
     */
    key?: Optional<string | symbol>;
    /**
     * The request context.
     */
    request: IHttpRequest;
    /**
     * The response context.
     */
    response: IHttpResponse;
    /**
     * The source value.
     */
    source: any;
}

/**
 * Options for `Parameter` decorator.
 */
export interface IParameterOptions<TSource extends ParameterSource> {
    /**
     * The name of the source.
     */
    source: Nilable<TSource>;
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as the current value of `body` property of request context.
 */
export interface IParameterOptionsWithBodySource extends IParameterOptions<"body">, IParameterOptionsWithTransformableDataSource {
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as from HTTP request header.
 */
export interface IParameterOptionsWithHeaderSource extends IParameterOptions<"header">, IParameterOptionsWithTransformableDataSource {
    /**
     * The custom header name.
     */
    name?: Nilable<string>;
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as from one or more HTTP request header.
 */
export interface IParameterOptionsWithHeadersSource extends IParameterOptions<"headers">, IParameterOptionsWithTransformableDataSource {
    /**
     * One or more header names. If not defined, all headers are taken.
     */
    names?: Nilable<string[]>;
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as from query search parameter.
 */
export interface IParameterOptionsWithQuerySource extends IParameterOptions<"query">, IParameterOptionsWithTransformableDataSource {
    /**
     * The custom name of the query parameter.
     */
    name?: Nilable<string>;
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as from one or more query parameter.
 */
export interface IParameterOptionsWithQueriesSource extends IParameterOptions<"queries">, IParameterOptionsWithTransformableDataSource {
    /**
     * One or more query parameter names. If not defined, all parameters are taken.
     */
    names?: Nilable<string[]>;
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as the current request context.
 */
export interface IParameterOptionsWithRequestSource extends IParameterOptions<"request"> {
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as the current response context.
 */
export interface IParameterOptionsWithResponseSource extends IParameterOptions<"response"> {
}

/**
 * Base type for options for `Parameter` decorator, which allows to
 * transform and validate its input data.
 */
export interface IParameterOptionsWithTransformableDataSource {
    /**
     * A custom function, which transforms input data
     * to a new format / type.
     */
    transformTo?: Nilable<ParameterDataTransformTo>;
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter from URL parameter.
 */
export interface IParameterOptionsWithUrlSource extends PartialBy<IParameterOptions<"url">, "source">, IParameterOptionsWithTransformableDataSource {
    /**
     * The custom name of the url parameter.
     */
    name?: Nilable<string>;
}

/**
 * Options for `Parameter` decorator, which defines the source of
 * the paremeter as from one or more url parameter.
 */
export interface IParameterOptionsWithUrlsSource extends IParameterOptions<"urls">, IParameterOptionsWithTransformableDataSource {
    /**
     * One or more url parameter names. If not defined, all parameters are taken.
     */
    names?: Nilable<string[]>;
}

/**
 * Context for a 'SetupAuthorizeMiddlewareHandler' function.
 */
export interface ISetupAuthorizeMiddlewareHandlerContext {
    /**
     * The 'authorize' middleware to setup.
     */
    authorizeMiddlewares: HttpMiddleware[];
    /**
     * The array with the current list of middlewares.
     */
    middlewares: HttpMiddleware[];
}

/**
 * Arguments for a `SwaggerInitializedEventHandler` instance.
 */
export interface ISwaggerInitializedEventArguments {
    /**
     * The underlying server instance.
     */
    app: IHttpServer;
    /**
     * The underlying documentation.
     */
    documentation: OpenAPIV3.Document;
    /**
     * Indicates, if UI is enabled or not.
     */
    isUIEnabled: boolean;
}

/**
 * Context for a `TestEventCancellationEventHandler` function.
 */
export interface ITestEventCancellationEventHandlerContext {
    /**
     * The reason.
     */
    reason: CancellationReason;
}

/**
 * A context for a `TestEventHandler`.
 */
export interface ITestEventHandlerContext {
    /**
     * The (request) body.
     */
    readonly body: any;
    /**
     * A reason for cancellation.
     */
    readonly cancellationReason: Optional<"timeout">;
    /**
     * Gets if cancellation has been requested or not.
     */
    readonly cancellationRequested: boolean;
    /**
     * The context, where the test is running in.
     */
    readonly context: "controller";
    /**
     * Can be executed from the listener to handle a failed test.
     */
    readonly countFailure: () => Promise<void>;
    /**
     * The description of the specific test.
     */
    readonly description: string;
    /**
     * Value of `query` as escaped string
     */
    readonly escapedQuery: string;
    /**
     * Ready-to-use path of the route with injected / replaced and escaped parameter values.
     */
    readonly escapedRoute: string;
    /**
     * Expectations for the response.
     */
    readonly expectations: ITestEventHandlerContextExpectations;
    /**
     * The full path of the underlying file.
     */
    readonly file: string;
    /**
     * The test group / category.
     */
    readonly group: string;
    /**
     * The zero-based index of the current test, inside the `group`.
     */
    readonly groupIndex: number;
    /**
     * Some value, change with the group.
     */
    readonly groupTag: any;
    /**
     * HTTP request headers.
     */
    readonly headers: Record<string, string>;
    /**
     * The HTTP method.
     */
    readonly httpMethod: HttpMethod;
    /**
     * The zero-based index of the current test.
     */
    readonly index: number;
    /**
     * The name / key of the underlying method.
     */
    readonly methodName: string | symbol;
    /**
     * Gets or sets a function, which listens for a cancellation event.
     */
    onCancellationRequested: Nilable<TestEventCancellationEventHandler>;
    /**
     * URL parameters to use.
     */
    readonly parameters: Record<string, string>;
    /**
     * Query parameters.
     */
    readonly query: Record<string, string>;
    /**
     * A reference value.
     */
    readonly ref: any;
    /**
     * The path of the route with possible parameters.
     */
    readonly route: string;
    /**
     * The underlying server instance.
     */
    readonly server: IHttpServer;
    /**
     * The current test session.
     */
    readonly session: Readonly<ITestSession>;
    /**
     * Some value for this event (operation).
     */
    readonly tag: any;
    /**
     * The total number of tests.
     */
    readonly totalCount: number;
    /**
     * A custom validator function.
     */
    readonly validate?: (context: ITestResponseValidatorContext) => Promise<any>;
}

/**
 * Expectations for a test response.
 */
export interface ITestEventHandlerContextExpectations {
    /**
     * The body.
     */
    body: any;
    /**
     * Headers.
     */
    headers: Record<string, string | RegExp>;
    /**
     * The status code.
     */
    status: number;
}

/**
 * Data of a test session.
 */
export interface ITestSession {
    /**
     * The start time.
     */
    end?: Date;
    /**
     * The ID.
     */
    id: string;
    /**
     * The start time.
     */
    start: Date;
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
 * Options, setting up a test.
 */
export interface ITestSettings {
    /**
     * An additional function, which is executed AFTER the underlying test.
     */
    after?: Nilable<AfterEachTestFunc>;
    /**
     * An additional function, which is executed before the underlying test.
     */
    before?: Nilable<BeforeEachTestFunc>;
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
     * This is an explicit reference to the underlying test,
     * declared by things like `@It()` decorator.
     */
    ref?: any;
    /**
     * A custom sort order, inside the group.
     */
    sortOrder?: any;
    /**
     * Something optional, that should submitted to a test event / operation.
     */
    tag?: any;
    /**
     * Custom timeout value in ms.
     */
    timeout?: Nilable<TestSettingValueOrGetter<number>>;
    /**
     * A custom validator function.
     */
    validator?: Nilable<TestResponseValidator>;
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
 * A possible value for a JSONSchema*
 */
export type JsonSchema = JSONSchema4 | JSONSchema6 | JSONSchema7;

/**
 * A handler, which is invoked, when a JSON schema validation fails.
 *
 * @param {IJsonSchemaError[]} errors The list of errors.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export type JsonSchemaValidationFailedHandler = (errors: IJsonSchemaError[], request: IHttpRequest, response: IHttpResponse) => any;

/**
 * A (lazy) value.
 */
export type LazyImportValue<T extends any = any> = T | (() => T);

/**
 * A next function.
 *
 * @param {Nilable<any>} [error] The error, if occurred.
 */
export type NextFunction = (error?: Nilable<any>) => void;

/**
 * A possible value for a first argument for `Parameter` decorator.
 */
export type ParameterArgument1 = ParameterSource | ParameterDataTransformer | ParameterOptions;

/**
 * A possible value for a second argument for `Parameter` decorator.
 */
export type ParameterArgument2 = ParameterDataTransformer | string;

/**
 * A possible value for a third argument for `Parameter` decorator.
 */
export type ParameterArgument3 = ParameterDataTransformTo;

/**
 * A function, which transforms an input parameter value
 * into a new one.
 *
 * @param {IParameterDataTransformerContext} context The context.
 *
 * @returns {any|PromiseLike<any>} The new value or the promise with it.
 */
export type ParameterDataTransformer = (context: IParameterDataTransformerContext) => any | PromiseLike<any>;

/**
 * Possible option values for `Parameter` decorator.
 */
export type ParameterOptions =
    IParameterOptionsWithBodySource |
    IParameterOptionsWithHeaderSource |
    IParameterOptionsWithHeadersSource |
    IParameterOptionsWithQueriesSource |
    IParameterOptionsWithQuerySource |
    IParameterOptionsWithRequestSource |
    IParameterOptionsWithResponseSource |
    IParameterOptionsWithUrlSource |
    IParameterOptionsWithUrlsSource;

/**
 * A possible value for `transformTo` property of an
 * `IParameterOptionsWithTransformableDataSource` object.
 */
export type ParameterDataTransformTo = "bool" | "buffer" | "float" | "int" | "string" | ParameterDataTransformer;

/**
 * A possible value for a parameter source.
 */
export type ParameterSource =
    "body" |
    "header" |
    "headers" |
    "queries" |
    "query" |
    "request" |
    "response" |
    "url" |
    "urls";

/**
 * A handler, that is executed, if data could not be parsed.
 *
 * @param {ParseError} error The thrown error.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export type ParseErrorHandler = (error: ParseError, request: IHttpRequest, response: IHttpResponse) => Promise<any>;

/**
 * A function, that serializes something for the response
 * and sends it.
 *
 * @param {TResult} result The result to serialize.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export type ResponseSerializer<TResult extends any = any> =
    (result: TResult, request: IHttpRequest, response: IHttpResponse) => any;

/**
 * A function, that sets up a 'authorize' middleware for a route.
 *
 * @param {ISetupAuthorizeMiddlewareHandlerContext} context The context.
 */
export type SetupAuthorizeMiddlewareHandler = (context: ISetupAuthorizeMiddlewareHandlerContext) => any;

/**
 * A possible value for a schema.
 */
export type Schema = AnySchema | JsonSchema;

/**
 * A handler for fast and generic JSON schema validations.
 *
 * @param {AjvError[]} errors The occurred errors.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export type SchemaValidationFailedHandler = (errors: AjvError[], request: IHttpRequest, response: IHttpResponse) => any;

/**
 * Is invoked after a Swagger documentation has been loaded, initialized and added to the context.
 *
 * @param {ISwaggerInitializedEventArguments} args The arguments.
 */
export type SwaggerInitializedEventHandler = (args: ISwaggerInitializedEventArguments) => any;

/**
 * A listener / handler, which is invoked, when a cancellation is required.
 *
 * @param {ITestEventCancellationEventHandlerContext} context The context.
 */
export type TestEventCancellationEventHandler = (context: ITestEventCancellationEventHandlerContext) => any;

/**
 * An event handler, running a test.
 *
 * @param {ITestEventHandlerContext} context The context.
 */
export type TestEventHandler = (context: ITestEventHandlerContext) => any;

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

/**
 * An unique middleware.
 */
export type UniqueHttpMiddleware = HttpMiddleware & {
    /**
     * The key, which indicates the (type) of middleware.
     */
    readonly [middleware]: unique symbol;
};

/**
 * A handler, that is executed, if data is invalid.
 *
 * @param {JoiValidationError} error The error information.
 * @param {IHttpRequest} request The request context.
 * @param {IHttpResponse} response The response context.
 */
export type ValidationFailedHandler = (error: JoiValidationError, request: IHttpRequest, response: IHttpResponse) => any;
