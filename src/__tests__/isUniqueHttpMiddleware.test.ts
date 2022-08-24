import joi from "joi";
import { isUniqueHttpMiddleware } from "..";
import { apiKey, auth, basicAuth, buffer, cookies, json, lang, query, text, validate, validateQuery, validateWithSwagger, yaml } from "../middlewares";
import { UniqueHttpMiddleware } from "../types";

const uniqueMiddlewares: UniqueHttpMiddleware[] = [
    apiKey(""),
    auth("", ""),
    basicAuth("", ""),
    buffer(),
    cookies(),
    json(),
    lang(""),
    query(),
    text(),
    validate(joi.object()),
    validateQuery(joi.object()),
    validateWithSwagger({
        "documentation": {
            "responses": {}
        }
    }),
    yaml()
];

const nonUniqueMiddlewares: any[] = [
    () => {
    },
    async () => {
    },
    null,
    false,
    undefined,
    "",
    1,
    {},
    Symbol(),
    []
];

describe("isUniqueHttpMiddleware()", () => {
    uniqueMiddlewares.forEach((mw) => {
        it("should return (true) to indicate its an UniqueHttpMiddleware", async () => {
            expect(isUniqueHttpMiddleware(mw)).toBe(true);
        });
    });

    nonUniqueMiddlewares.forEach((mw) => {
        it("should return (false) to indicate its NOT an UniqueHttpMiddleware", async () => {
            expect(isUniqueHttpMiddleware(mw)).toBe(false);
        });
    });
});
