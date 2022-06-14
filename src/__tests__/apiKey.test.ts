import request from "supertest";
import { apiKey, ApiKeyValidator } from "../middlewares";
import { HttpRequestPath, IHttpRequest, IHttpResponse } from "../types";
import { binaryParser, createServer } from "./utils";

const routePaths: HttpRequestPath[] = [
    "/",
    (request) => {
        return request.url === "/";
    },
    /^(\/)$/i
];

const invalidApiKeyMessage = "Invalid API key!";
const key = "myTestApiKey";

const onValidationFailed: ApiKeyValidator = async (request, response) => {
    const errorMessage = Buffer.from(invalidApiKeyMessage, "utf8");

    if (!response.headersSent) {
        response.writeHead(403, {
            "Content-Length": String(errorMessage.length)
        });
    }

    response.write(errorMessage);
};

describe("apiKey() middleware", () => {
    ["get", "delete", "options", "patch", "put", "post", "trace"].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 when send a valid key via X-API-KEY header on a ${methodName} request`, async (path) => {
            const expectedResponse = key.toUpperCase();

            const server = createServer();

            (server as any)[method](path, [
                apiKey(key)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write((request.headers["x-api-key"] as string).toUpperCase());
            });

            const response = await (request(server) as any)[method]("/")
                .set("x-api-key", key)
                .send()
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString("utf8");

            expect(typeof str).toBe("string");
            expect(str).toBe(expectedResponse);
        });

        it.each(routePaths)(`should return 401 when send an in-valid key via X-API-KEY header on a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                apiKey(key)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write((request.headers["x-api-key"] as string).toUpperCase());
            });

            await (request(server) as any)[method]("/")
                .set("x-api-key", key + "!!!INVALIDKEY!!!")
                .send()
                .parse(binaryParser)
                .expect(401);
        });

        it.each(routePaths)(`should return 403 when using custom error handler and send an in-valid key via X-API-KEY header on a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                apiKey(key, onValidationFailed)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write((request.headers["x-api-key"] as string).toUpperCase());
            });

            await (request(server) as any)[method]("/")
                .set("x-api-key", key + "!!!INVALIDKEY!!!")
                .send()
                .parse(binaryParser)
                .expect(403);
        });

        it.each(routePaths)(`should return 200 when send a valid key via X-EGO-KEY header on a ${methodName} request`, async (path) => {
            const expectedResponse = key.toUpperCase();

            const server = createServer();

            (server as any)[method](path, [
                apiKey(key, "x-ego-key")
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write((request.headers["x-ego-key"] as string).toUpperCase());
            });

            const response = await (request(server) as any)[method]("/")
                .set("x-ego-key", key)
                .send()
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString("utf8");

            expect(typeof str).toBe("string");
            expect(str).toBe(expectedResponse);
        });

        it.each(routePaths)(`should return 401 when send an in-valid key via X-EGO-KEY header on a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                apiKey(key, "x-ego-key")
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write((request.headers["x-ego-key"] as string).toUpperCase());
            });

            await (request(server) as any)[method]("/")
                .set("x-ego-key", key + "!!!INVALIDKEY!!!")
                .send()
                .expect(401);
        });

        it.each(routePaths)(`should return 403 when using custom error handler and send an in-valid key via X-EGO-KEY header on a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                apiKey(key, "x-ego-key", onValidationFailed)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write((request.headers["x-ego-key"] as string).toUpperCase());
            });

            await (request(server) as any)[method]("/")
                .set("x-ego-key", key + "!!!INVALIDKEY!!!")
                .send()
                .expect(403);
        });
    });
});
