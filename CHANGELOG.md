# Change Log (@egomobile/http-server)

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
