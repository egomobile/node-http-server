# Change Log (@egomobile/http-server)

## 0.51.3

- **BREAKING CHANGE**: move `loadOpenAPIFiles` and `requiresDocumentationEverywhere` props from [IControllersSwaggerOptions](https://egomobile.github.io/node-http-server/interfaces/IControllersSwaggerOptions.html) to [IControllersOptions](https://egomobile.github.io/node-http-server/interfaces/IControllersOptions.html)
- (bug-)fixes

## 0.50.2

- **BREAKING CHANGE**: [@Describe() decorator](https://egomobile.github.io/node-http-server/functions/Describe.html) will throw an exception, if it is tried to be used more than once in a controller class
- improve constructor arguments of [@Describe() decorator][https://egomobile.github.io/node-http-server/functions/describe.html]
- (bug-)fixes

## 0.49.1

- **BREAKING CHANGE**: tests are sorted now the following way:
  - by `sortBy` value of [@Describe() decorator](https://egomobile.github.io/node-http-server/functions/Describe.html)
  - then: by `name` argument of [@Describe() decorator](https://egomobile.github.io/node-http-server/functions/Describe.html) (case-insensitive)
  - then: by `sortBy` value of [ITestSettings interface](https://egomobile.github.io/node-http-server/interfaces/ITestSettings.html)
  - then: by `name` argument of [@It() decorator](https://egomobile.github.io/node-http-server/functions/It.html) (case-insensitive)
- update compiler options to `es2021`
- deactivate building source maps
- add `sortBy` prop to [ITestSettings interface](https://egomobile.github.io/node-http-server/interfaces/ITestSettings.html)
- add `tag` prop to [ITestSettings](https://egomobile.github.io/node-http-server/interfaces/ITestSettings.html) and [ITestEventHandlerContext](https://egomobile.github.io/node-http-server/interfaces/ITestEventHandlerContext.html) interfaces
- add `groupTag` to [ITestEventHandlerContext interface](https://egomobile.github.io/node-http-server/interfaces/ITestEventHandlerContext.html)
- [@Describe() decorator](https://egomobile.github.io/node-http-server/functions/Describe.html) now supports custom settings, represented by new `IDescribeOptions` interface
- (bug-)fixes

## 0.48.3

- **BREAKING CHANGE**: replace `once()` method with `on` in [IHttpServer interface](https://egomobile.github.io/node-http-server/interfaces/IHttpServer.html)
- **BREAKING CHANGE**: `ItSettingsOrValidator` type has been replaced with `ItArgument2`
- improve [@It() decorator](https://egomobile.github.io/node-http-server/functions/It.html) with additional arguments and type definitions.
- (bug-)fixes

## 0.47.2

- add following placeholders for `name` argument of [@It() decorator](https://egomobile.github.io/node-http-server/functions/It.html):
  - `{{parameters}}`: list of comma-separated parameter list, example: `"param1" = "param1 value", "param2" = "param2 value"`
- (bug-)fixes

## 0.46.0

- `name` argument of [@It() decorator](https://egomobile.github.io/node-http-server/functions/It.html) now supports templating with the following placeholders:
  - `{{body}}`: expected body
  - `{{header:my-header}}`: expected value for header `my-header`
  - `{{parameter:myParameter}}`: submitted value of URL parameter `myParameter`
  - `{{status}}`: expected HTTP status code
- can implement / declare multiple tests / test settings in `.spec` files now
- add `groupIndex` and `ref` props to [ITestEventHandlerContext interface](https://egomobile.github.io/node-http-server/interfaces/ITestEventHandlerContext.html)
- add `ref` prop to [ITestSettings interface](https://egomobile.github.io/node-http-server/interfaces/ITestSettings.html)

## 0.45.0

- add `isUIEnabled` property to [ISwaggerInitializedEventArguments interface](https://egomobile.github.io/node-http-server/interfaces/ISwaggerInitializedEventArguments.html)
- (bug-)fixes

## 0.44.1

- **BREAKING CHANGE**: [validateWithDocumentation property](https://egomobile.github.io/node-http-server/interfaces/IControllersOptions.html#validateWithDocumentation) in [IControllersOptions interface](https://egomobile.github.io/node-http-server/interfaces/IControllersOptions.html) is `true` by default
- (bug-)fixes

## 0.43.4

- add `loadOpenAPIFiles` to [IControllerMethodInfo](https://egomobile.github.io/node-http-server/interfaces/IControllerMethodInfo.html), which can load resources for a Swagger document, organized in `.openapi` files
- (bug-)fixes

## 0.42.2

- add `resourcePath` to [IControllerMethodInfo](https://egomobile.github.io/node-http-server/interfaces/IControllerMethodInfo.html), which can load resources for a Swagger document, organized in a strict structure
- (bug-)fixes

## 0.41.0

- **BREAKING CHANGE**: module requires at least [Node 16+](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V16.md) now
- **BREAKING CHANGE**: controller files are now sorted the following way:
  - by number of parts, separated by path chars like `/`
  - then: all directories, starting with `@`, will be moved to the bottom
  - then: by directory path (case-insensitive)
  - then: all files, starting with `@`, will be moved to the bottom
  - then: by file name (case-insensitive)
- add `Describe()` and `It()` decorators, that can setup (unit-)tests for controller methods, e.g.
- implement `validateAjv()` middleware
- if Swagger documentation is activated, all endpoints have to be documented by default now ... this behavior can be controlled by new `requiresDocumentationEverywhere` prop of [IControllersOptions interface](https://egomobile.github.io/node-http-server/interfaces/IControllersOptions.html)
- `npm update`s
- code cleanups and improvements
- (bug-)fixes

## 0.40.0

- add `doesValidate`, `doesValidateQuery`, `hasAuthorize` and `middlewares` properties to [IDocumentationUpdaterContext interface](https://egomobile.github.io/node-http-server/interfaces/IDocumentationUpdaterContext.html)
- all build-in middlewares are now of new type `UniqueHttpMiddleware`, which is compatible to [HttpMiddleware](https://egomobile.github.io/node-http-server/types/HttpMiddleware.html)
- `npm update`s

## 0.39.0

- add `use` property to [IControllersSwaggerOptions interface](https://egomobile.github.io/node-http-server/interfaces/IControllersSwaggerOptions.html)
- `npm update`s

## 0.38.0

- add `instance` property to [IHttpServer interface](https://egomobile.github.io/node-http-server/interfaces/IHttpServer.html)
- `npm update`s

## 0.37.0

- Swagger documents are validated with [openapi-schema-validator module](https://www.npmjs.com/package/openapi-schema-validator) by default now ... this behavior can be changed, updating [validate property](https://egomobile.github.io/node-http-server/interfaces/IControllersSwaggerOptions.html#document)
- implement `validateWithSwagger()` middleware and its representations inside the controller framework, like [@GET()](https://egomobile.github.io/node-http-server/modules.html#GET) or [@POST()](https://egomobile.github.io/node-http-server/modules.html#POST) decorators
- code cleanups and improvements
- (bug-)fixes

## 0.36.1

- implement `@BodyParseErrorHandler()` decorator to handle parse errors in combination with [schema validation, configured by decorators](https://github.com/egomobile/node-http-server/wiki/Controllers#validate-input)
- add `onParsingFailed` prop to [IControllerRouteWithBodyOptions](https://egomobile.github.io/node-http-server/interfaces/IControllerRouteWithBodyOptions.html) and [IHttpBodyParserOptions](https://egomobile.github.io/node-http-server/interfaces/IHttpBodyParserOptions.html) interfaces
- add `onParsingFailed` and `onSchemaValidationFailed` prop to [IControllersOptions](https://egomobile.github.io/node-http-server/interfaces/IControllersOptions.html)
- also add `onControllerInitialized`, `onControllerMethodInitialized` and `onSwaggerInitialized` to [IControllersOptions](https://egomobile.github.io/node-http-server/interfaces/IControllersOptions.html), which can help debugging
- (bug-)fixes
- code cleanups and improvements

## 0.35.2

- implement decorators to import values into a request handler argument / parameter:
  - `@Parameter()`: Generic way to import a value
  - `@Body()`: import [request body](https://egomobile.github.io/node-http-server/interfaces/IHttpRequest.html#body)
  - `@Headers()`: import [HTTP request headers](https://egomobile.github.io/node-http-server/interfaces/IHttpRequest.html#headers) as key/value pair object
  - `@Query()`: import [query parameters from URL](https://egomobile.github.io/node-http-server/interfaces/IHttpRequest.html#query) as key/value pair object
  - `@Request()`: import [request context](https://egomobile.github.io/node-http-server/interfaces/IHttpRequest.html)
  - `@Response()`: import [response context](https://egomobile.github.io/node-http-server/interfaces/IHttpResponse.html)
  - `@Url()`: import [URL parameters](https://egomobile.github.io/node-http-server/interfaces/IHttpRequest.html#params) as key/value pair object
- [HttpPathValidator](https://egomobile.github.io/node-http-server/modules.html#HttpPathValidator) can be asynchronious now
- fix typings
- apply new [eslint-config-ego](https://github.com/egomobile/eslint-config-ego) settings
- module requires at least [Node 14+](https://nodejs.org/gl/blog/release/v14.0.0/) now
- (bug-)fixes
- `npm update`s

## 0.34.0

- implement [@Authorize() decorator](https://egomobile.github.io/node-http-server/modules.html#Authorize) and [authorize](https://egomobile.github.io/node-http-server/interfaces/IControllerRouteOptions.html#authorize) options

## 0.33.1

- remove [regexparam](https://github.com/lukeed/regexparam) by [Luke Edwards](https://github.com/lukeed) and use code directly to reduce dependencies
- remove [mrmime](https://github.com/lukeed/mrmime) by [Luke Edwards](https://github.com/lukeed) to reduce dependencies
- improve compilation of handlers and middlewares
- fix minor typos
- improve and fix [lang()](https://egomobile.github.io/node-http-server/modules.html#lang)
- improve Swagger features
- move following types to `internal`:
  - `Constructor`
  - `GetterFunc`
- improve tests

## 0.32.0

- improve and fix [lang()](https://egomobile.github.io/node-http-server/modules.html#lang) middleware
- [@CONNECT()](https://egomobile.github.io/node-http-server/modules.html#CONNECT) does not support input bodies anymore
- type checks for arguments in [params()](https://egomobile.github.io/node-http-server/modules.html#params) validator
- remove `prettyErrors()` error handler
- other code cleanups and improvements
- (bug-)fixes

## 0.31.0

- replace use of [substr()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substr) with [substring()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring)

## 0.30.2

- type check for `key` parameter of [@Import() decorator](https://egomobile.github.io/node-http-server/modules.html#Import)
- optimize serializer feature
- update [Youch!](https://github.com/poppinss/youch) to version `3.0.0`
- add benchmarks to `benchmarks` sub folder
- fix typos

## 0.29.0

- implement [all() method](https://egomobile.github.io/node-http-server/interfaces/IHttpServer.html#all)

## 0.28.0

- implement [validateQuery](https://egomobile.github.io/node-http-server/modules.html#validateQuery) middleware

## 0.27.1

- `key` parameter of [@Import() decorator](https://egomobile.github.io/node-http-server/modules.html#Import) is now optional, what means that, if no key is submitted, the name of the underlying property is used
- (bug-)fixes

## 0.26.1

- add [@Import() decorator](https://egomobile.github.io/node-http-server/modules.html#Import), which can import values into a controller's property or provide them there

## 0.25.0

- **BREAKING CHANGE**: `Nilable<T>`, `Nullable<T>` and `Optional<T>` are not public anymore and internal types now

## 0.24.0

- **BREAKING CHANGE**: [auth()](https://egomobile.github.io/node-http-server/modules.html#auth) and [apiKey()](https://egomobile.github.io/node-http-server/modules.html#apiKey) using try-catch blocks now
- **BREAKING CHANGE**: [buffer()](https://egomobile.github.io/node-http-server/modules.html#buffer), [json()](https://egomobile.github.io/node-http-server/modules.html#json), [text()](https://egomobile.github.io/node-http-server/modules.html#text) and [yaml()](https://egomobile.github.io/node-http-server/modules.html#yaml) set [body prop](https://egomobile.github.io/node-http-server/interfaces/IHttpRequest.html#body) to `(null)` now, if HTTP method is not `PATCH`, `POST` or `PUT`
- add `notFoundHandler` property to [IHttpServer](https://egomobile.github.io/node-http-server/interfaces/IHttpServer.html)
- improve speed of internal helper functions
- fix typos

## 0.23.0

- implement [basicAuth](https://egomobile.github.io/node-http-server/modules.html#basicAuth) middleware
- code cleanups and improvements

## 0.22.0

- (bug-)fixes

## 0.21.0

- do not trim value in [auth()](https://egomobile.github.io/node-http-server/modules.html#auth) middleware anymore

## 0.20.0

- improve [auth()](https://egomobile.github.io/node-http-server/modules.html#auth) middleware

## 0.19.0

- implement [auth](https://egomobile.github.io/node-http-server/modules.html#auth) middleware
- improve [defaultApiKeyValidationFailedHandler](https://egomobile.github.io/node-http-server/modules.html#defaultApiKeyValidationFailedHandler) and [defaultParseErrorHandler](https://egomobile.github.io/node-http-server/modules.html#defaultParseErrorHandler)
- code cleanups and improvements
- (bug-)fixes

## 0.18.1

- implement [@Use()](https://egomobile.github.io/node-http-server/modules.html#Use) decorator
- replace [mime-types](https://www.npmjs.com/package/mime-types) with [mrmime](https://www.npmjs.com/package/mrmime)
- can download Swagger documentation over endpoints like `/swagger/yaml` now
- `npm update`s
- (bug-)fixes, like [issue #11](https://github.com/egomobile/node-http-server/issues/11)

## 0.17.1

- removed `bind()` calls
- (bug-)fixes

## 0.16.0

- now bind `ValidationErrorHandler()`, `ErrorHandler()`, `Serializer`, `DocumentationUpdater()` and controller methods to controller instance

## 0.15.1

- [query() middleware](https://egomobile.github.io/node-http-server/modules.html#query) is automatically added as 1st middleware to each controller by default now
- add `noQueryParams` to [IControllerRouteOptions](https://egomobile.github.io/node-http-server/interfaces/IControllerRouteOptions.html) and [IControllersOptions](https://egomobile.github.io/node-http-server/interfaces/IControllersOptions.html)
- add missing method check, if try to use schema validation in controller methods
- (bug-)fixes

## 0.14.0

- **BREAKING CHANGE**: [DELETE()](https://egomobile.github.io/node-http-server/modules.html#DELETE), [HEAD()](https://egomobile.github.io/node-http-server/modules.html#HEAD), [OPTIONS()](https://egomobile.github.io/node-http-server/modules.html#OPTIONS) and [TRACE()](https://egomobile.github.io/node-http-server/modules.html#TRACE) decorators do not support bodies anymore: https://specs.openstack.org/openstack/api-wg/guidelines/http/methods.html
- add `apiKey()` middleware
- cleanup tests
- made versions in `package.json` explicit

## 0.13.1

- add missing export of `ValidationErrorHandler()` decorator
- `npm update`
- (bug-)fixes

## 0.12.0

- optimize `readStreamWithLimit()` function
- `npm update`

## 0.11.0

- add `yaml()` middleware
- add optional `encoding` props for options of `json()` and `text()` middlewares

## 0.10.0

- add `text()` middleware
- `npm update`
- fix, cleanup and improve documentation

## 0.9.1

- bugfixes
- `npm update`

## 0.8.0

- implement `ValidationErrorHandler()` decorator
- add VSCode debugger settings
- bugfixes

## 0.7.0

- implement controller framework, similar to
  [express-controllers](https://github.com/egodigital/express-controllers):
  - decorators for `CONNECT`, `DELETE`, `GET`, `HEAD`, `OPTIONS`, `PATCH`,
    `POST`, `PUT`, `TRACE` HTTP methods
  - decorators for setting up custom, controller-wide serializers and error
    handlers
- code cleanups and improvements
- bugfixes

## 0.6.0

- add `prettyErrors()` error handler
- fix tests

## 0.5.0

- **BREAKING CHANGE**: replace use of
  [querystring](https://nodejs.org/api/querystring.html) with
  [URLSearchParams](https://nodejs.org/api/url.html#url_class_urlsearchparams)
- add `cookies()` and `lang()` middlewares
- cleanup documentation
- add optional `TBody` type parameter to `IHttpRequest` interface to describe
  body property
- `npm update`

## 0.4.0

- add `validate()` middleware
- add `schema` namespace as [joi](https://www.npmjs.com/package/joi) alias
- fix documentation
- bugfixes

## 0.3.1

- add `query()` middleware
- fix `params()` path validator
- fix README
- fixes in path validation

## 0.2.2

- add `params()` middleware
- `next()` function of a middleware can receive an error object now
- make sure, that all handlers and middlewares are async functions now
- update type descriptions for handlers and middlewars
- (bug-)fixes

## 0.1.2

- initial release
