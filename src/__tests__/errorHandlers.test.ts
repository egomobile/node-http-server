import { binaryParser, createServer } from "./utils";
import request from "supertest";
import { HttpRequestPath, IHttpRequest, IHttpResponse } from "../types";

const routePaths: HttpRequestPath[] = [
    "/",
    (request) => {
        return request.url === "/";
    },
    /^(\/)$/i
];

describe("error handlers", () => {
    ["delete", "get", "options", "patch", "put", "post", "trace"].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 500, when do a ${methodName} request with a default error handler`, async (path) => {
            const server = createServer();

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                throw new Error("Something, went wrong!");
            });

            const response = await (request(server) as any)[method]("/")
                .send()
                .parse(binaryParser)
                .expect(500);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });

        it.each(routePaths)(`should return 400, when do a ${methodName} request with a custom error handler`, async (path) => {
            const server = createServer();

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                throw new Error("Something, went wrong!");
            });

            server.setErrorHandler(async (error, request, response) => {
                const errorMessage = Buffer.from("SERVER ERROR: " + String(error));

                if (!response.headersSent) {
                    response.writeHead(400);
                }

                response.write(errorMessage);
                response.end();
            });

            const response = await (request(server) as any)[method]("/")
                .send()
                .parse(binaryParser)
                .expect(400);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(43);

            const str: string = data.toString("utf8");
            expect(typeof str).toBe("string");
            expect(str).toBe("SERVER ERROR: Error: Something, went wrong!");
        });
    });
});
