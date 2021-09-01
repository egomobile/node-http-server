# Change Log (@egomobile/http-server)

## 0.5.0

- **BREAKING CHANGE**: replace use of [querystring](https://nodejs.org/api/querystring.html) with [URLSearchParams](https://nodejs.org/api/url.html#url_class_urlsearchparams)
- add `cookies()` and `lang()` middlewares
- cleanup documentation
- add optional `TBody` type parameter to `IHttpRequest` interface to describe body property
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
