import request from "supertest";
import { auth, AuthValidationFailedHandler } from "../middlewares";
import { HttpRequestPath, IHttpRequest, IHttpResponse } from "../types";
import { createServer } from "./utils";

const routePaths: HttpRequestPath[] = [
    "/",
    (request) => {
        return request.url === "/";
    },
    /^(\/)$/i
];

const invalidApiKeyMessage = "Invalid auth header!";
const bearer = "myBearerValue";

const onValidationFailed: AuthValidationFailedHandler = async (request, response) => {
    const errorMessage = Buffer.from(invalidApiKeyMessage, "utf8");

    if (!response.headersSent) {
        response.writeHead(403, {
            "Content-Length": String(errorMessage.length)
        });
    }

    response.write(errorMessage);
};

describe("auth() middleware", () => {
    ["get", "delete", "options", "patch", "put", "post", "trace"].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 204 when send a valid value via Authorization header on a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                auth("Bearer", bearer)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    "Content-Type": "0"
                });
            });

            await (request(server) as any)[method]("/")
                .set("Authorization", "Bearer " + bearer)
                .send()
                .expect(204);
        });

        it.each(routePaths)(`should return 401 when send an in-valid value via Authorization header on a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                auth("Bearer", bearer)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    "Content-Type": "0"
                });
            });

            await (request(server) as any)[method]("/")
                .set("Authorization", "Bearer " + bearer + "FOO")
                .send()
                .expect(401);
        });

        it.each(routePaths)(`should return 401 when send an in-valid value via Authorization header on a ${methodName} request, using custom error handler`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                auth("Bearer", bearer, onValidationFailed)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    "Content-Type": "0"
                });
            });

            await (request(server) as any)[method]("/")
                .set("Authorization", "Bearer " + bearer + "FOO")
                .send()
                .expect(403);
        });
    });
});
