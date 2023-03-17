import request from "supertest";
import { binaryParser, getServers } from "./utils";

describe("endpoints with imports (HTTP 1)", () => {
    it("should return 200 when doing a GET request", async () => {
        const expectedResponse = Buffer.from("FOO 42 BUZZ");

        const {
            "httpServer2": app
        } = getServers();

        const response = await (request(app) as any).get("/test_imports")
            .send()
            .parse(binaryParser)
            .expect(200);

        const body = response.body as Buffer;

        expect(body.toString("utf8")).toBe(expectedResponse.toString("utf8"));
    });
});
