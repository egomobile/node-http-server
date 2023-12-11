// This file is part of the @egomobile/http-server distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-server is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-server is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import request from "supertest";
import { binaryParser, createServerAndInitControllers } from "./utils";

const invalidInputData: any[] = [{}];

describe("controllers", () => {
    it.each(["/", "/bar", "/foo"])("should return 200 when do a GET request for existing IndexController", async (p) => {
        const expectedResult = "bar:" + p;

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each(["/test_path_params/foo%20baz", "/test_path_params/foo%20baz/bar"])("should return 200 when do a GET request for existing TestParameterController which uses parameters", async (p) => {
        const expectedResult = "test:" + p + ":foo baz";

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each(["/test_path_params_via_dirs_1/foo%20baz", "/test_path_params_via_dirs_1/foo%20baz/bar"])("should return 200 when do a GET request for existing TestUrlParamsViaDirsController which uses parameters via directories", async (p) => {
        const expectedResult = "test2:" + p + ":foo baz";

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each(["/test_path_params_via_dirs_2/foo%20baz/foo/buzz", "/test_path_params_via_dirs_2/foo%20baz/foo/buzz/bar"])("should return 200 when do a GET request for existing TestUrlParamsViaDirsController which uses parameters (Next.js style) via directories", async (p) => {
        const expectedResult = "test3:" + p + ":foo baz buzz";

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each(["/test_error_handler"])("should return 400 when do a GET request for existing TestErrorHandlerController with custom error handler", async (p) => {
        const expectedResult = "ERROR: " + p + " Something went wrong!";

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .parse(binaryParser)
            .expect(400);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each(["/test_parse_error_handler"])("should return 406 when do a POST request for existing TestParseErrorHandlerController with custom parse error handler", async (p) => {
        const expectedResult = "ERROR: " + p + " Unexpected end of JSON input";

        const server = createServerAndInitControllers();

        const response = await request(server).post(p)
            .send("{ \"a :, 12")
            .parse(binaryParser)
            .expect(406);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each(["/test_serializer"])("should return 200 when do a GET request for existing TestSerializerController with custom serializer", async (p) => {
        const expectedObject = {
            "success": true,
            "data": "foo"
        };

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .expect(200);

        const data = response.body;
        expect(typeof data).toBe("object");

        expect(response.headers["content-type"]).toBe("application/json; charset=UTF-8");

        expect(data).toMatchObject(expectedObject);
    });

    it.each(invalidInputData)("should return 400 when do a POST request on /test_schema_validation/joi route for existing TestSchemaValidationController with invalid input data", async (data) => {
        const server = createServerAndInitControllers();

        await request(server).post("/test_schema_validation/joi")
            .send(data)
            .expect(400);
    });

    it.each(invalidInputData)("should return 409 when do a POST request on /test_schema_validation/joi/foo route for existing TestSchemaValidationController with invalid input data", async (data) => {
        const server = createServerAndInitControllers();

        await request(server).post("/test_schema_validation/joi/foo")
            .send(data)
            .expect(409);
    });

    it.each(invalidInputData)("should return 400 when do a POST request on /test_schema_validation/ajv route for existing TestSchemaValidationController with invalid input data", async (data) => {
        const server = createServerAndInitControllers();

        await request(server).post("/test_schema_validation/ajv")
            .send(data)
            .expect(400);
    });

    it.each(invalidInputData)("should return 409 when do a POST request on /test_schema_validation/ajv/foo route for existing TestSchemaValidationController with invalid input data", async (data) => {
        const server = createServerAndInitControllers();

        await request(server).post("/test_schema_validation/ajv/foo")
            .send(data)
            .expect(409);
    });

    it.each(["/baz", "/baz/bar", "/baz/foo"])("should return 200 when do a GET request for existing BazController which uses middlewares", async (p) => {
        const expectedResult = "baz:" + p + ":21";

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each([{
        "path": "foo1",
        "expectedValue": "foo1 === 11"
    }, {
        "path": "foo2",
        "expectedValue": "foo2 === 3"
    }])("should return 200 when do a GET request for existing TestMiddlewaresController with global middlewares", async (item) => {
        const server = createServerAndInitControllers();

        const response = await request(server).get("/test_middlewares/" + item.path)
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(item.expectedValue.length);
        expect(str).toBe(item.expectedValue);
    });

    it("should return 200 when do a GET request for existing TestImportsController with import values", async () => {
        const expectedValue = "FOO:(bar string) BAZ:(42 number)";

        const server = createServerAndInitControllers();

        const response = await request(server).get("/test_imports")
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedValue.length);
        expect(str).toBe(expectedValue);
    });
});
