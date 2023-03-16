import type { HttpMethod } from "@egomobile/http-server";
import type { IncomingMessage } from "http";
import request from "supertest";
import { binaryParser, getServers } from "./utils";

const routePaths = [
    "/",
    (request: IncomingMessage) => {
        return request.url === "/";
    },
    /^(\/)$/i
];

const httpMethods: HttpMethod[] = ["get"];

describe("simple endpoints (HTTP 1)", () => {
    httpMethods.forEach((method: any) => {
        it.each(routePaths)(`should return 200 when doing a ${method.toUpperCase()} request with a known path`, async (path) => {
            const expectedResponse = Buffer.from("OK");

            const {
                "httpServer1": app
            } = getServers();

            const response = await (request(app) as any)[method]("/")
                .send()
                .parse(binaryParser)
                .expect(200);

            const body = response.body as Buffer;

            expect(body.toString("utf8")).toBe(expectedResponse.toString("utf8"));
        });

        it.each(routePaths)(`should return 404 when doing a ${method.toUpperCase()} request with a known path`, async (path) => {
            const {
                "httpServer1": app
            } = getServers();

            await (request(app) as any)[method]("/foo")
                .send()
                .parse(binaryParser)
                .expect(404);
        });
    });
});
