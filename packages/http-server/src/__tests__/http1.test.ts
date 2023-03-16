import { IncomingMessage, ServerResponse } from "http";
import request from "supertest";
import { binaryParser } from "./utils";
const { createHttp1Server } = require("../../lib/index.cjs");

const routePaths = [
    "/",
    (request: IncomingMessage) => {
        return request.url === "/";
    },
    /^(\/)$/i
];

const httpMethods = ["get", "delete", "options", "patch", "put", "post", "trace"];

describe("simple endpoints (HTTP 1)", () => {
    httpMethods.forEach((method: any) => {
        it.each(routePaths)(`should return 200 when doing a ${method.toUpperCase()} request with a known path`, async (path) => {
            const expectedResponse = Buffer.from("Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.");

            const app = createHttp1Server();

            app[method](path, async (request: IncomingMessage, response: ServerResponse) => {
                response.end(expectedResponse);
            });

            const response = await (request(app) as any)[method]("/")
                .send()
                .parse(binaryParser)
                .expect(200);

            const body = response.body as Buffer;

            expect(body.toString("utf8")).toBe(expectedResponse.toString("utf8"));
        });

        it.each(routePaths)(`should return 404 when doing a ${method.toUpperCase()} request with a known path`, async (path) => {
            const app = createHttp1Server();

            app[method](path, async (request: IncomingMessage, response: ServerResponse) => {
                response.end("OK");
            });

            await (request(app) as any)[method]("/foo")
                .send()
                .parse(binaryParser)
                .expect(404);
        });
    });
});
