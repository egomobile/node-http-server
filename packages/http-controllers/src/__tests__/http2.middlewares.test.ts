import request from "supertest";
import { binaryParser, getServers } from "./utils";

const tests = [{
    "path": "test1",
    "expectedValue": "1"
}, {
    "path": "test2",
    "expectedValue": "12"
}];

describe("endpoints with middlewares (HTTP 2)", () => {
    it.each(tests)("should return 200 when doing a GET request", async (test) => {
        const expectedResponse = Buffer.from(test.expectedValue);

        const {
            "httpServer2": app
        } = getServers();

        const response = await (request(app) as any).get(`/test_middlewares/${test.path}`)
            .send()
            .parse(binaryParser)
            .expect(200);

        const body = response.body as Buffer;

        expect(body.toString("utf8")).toBe(expectedResponse.toString("utf8"));
    });
});
