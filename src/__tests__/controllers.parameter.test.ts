/* eslint-disable @typescript-eslint/naming-convention */

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

describe("Parameter feature tests (controllers)", () => {
    it("should return 200 when do a GET request, submitting URL parameters, for existing TestParameterController with expected result", async () => {
        const bar = "Marcel";
        const buzz = 239.79;

        const url = `/test_parameter/url/${encodeURIComponent(bar)}/${encodeURIComponent(String(buzz))}`;
        const expectedResult = `bar: ${bar} (${typeof bar}); buzz: ${buzz} (${typeof buzz})`;

        const server = createServerAndInitControllers();

        const response = await request(server).get(url)
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

    it("should return 200 when do a GET request, submitting header, for existing TestParameterController with expected result", async () => {
        const egoTest = true;

        const url = "/test_parameter/header";
        const expectedResult = `x-ego-test: ${egoTest} (${typeof egoTest})`;

        const server = createServerAndInitControllers();

        const response = await request(server).get(url)
            .set("X-Ego-Test", String(egoTest))
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

    it("should return 200 when do a GET request, submitting query parameters, for existing TestParameterController with expected result", async () => {
        const testParam = "Marcel Kloubert";
        const expectedTestParam = testParam.toUpperCase().trim();

        const url = `/test_parameter/query?testParam=${encodeURIComponent(testParam)}`;

        let expectedResult = `testParam: ${expectedTestParam} (${typeof expectedTestParam})\n`;
        expectedResult += "request\n";
        expectedResult += "response\n";

        const server = createServerAndInitControllers();

        const response = await request(server).get(url)
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

    it("should return 200 when do a GET request, submitting multi headers, for existing TestParameterController with expected result", async () => {
        const xEgo1 = "Marcel Kloubert";
        const xEgo2 = 23979;
        const xEgo3 = true;

        const url = "/test_parameter/multi-headers";

        let expectedResult = `${xEgo1} (${typeof xEgo1})\n`;
        expectedResult += `${xEgo2} (${typeof xEgo2})\n`;
        expectedResult += `${xEgo3} (${typeof xEgo3})\n`;

        const server = createServerAndInitControllers();

        const response = await request(server).get(url)
            .set("x-ego-1", String(xEgo1))
            .set("X-Ego-2", String(xEgo2))
            .set("X-EGO-3", String(xEgo3))
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

    it("should return 200 when do a GET request, submitting multi query parameters, for existing TestParameterController with expected result", async () => {
        const xEgo1 = "Marcel Kloubert";
        const xEgo2 = 23979;
        const xEgo3 = true;

        const url = `/test_parameter/multi-query?xEgo1=${encodeURIComponent(String(xEgo1))
            // eslint-disable-next-line @typescript-eslint/indent
            }&xEgo2=${encodeURIComponent(String(xEgo2))
            // eslint-disable-next-line @typescript-eslint/indent
            }&xEgo3=${encodeURIComponent(String(xEgo3))
            // eslint-disable-next-line @typescript-eslint/indent
            }`;

        let expectedResult = `${xEgo1} (${typeof xEgo1})\n`;
        expectedResult += `${xEgo2} (${typeof xEgo2})\n`;
        expectedResult += `${xEgo3} (${typeof xEgo3})\n`;

        const server = createServerAndInitControllers();

        const response = await request(server).get(url)
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

    it("should return 200 when do a POST request, submitting valid JSON data, for existing TestParameterController with expected result", async () => {
        const obj = {
            "foo": "bar",
            "buzz": 42
        };

        const server = createServerAndInitControllers();

        const url = "/test_parameter/body";

        const response = await request(server).post(url)
            .send(obj)
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const jsonStr = data.toString("utf8");
        const resultObj = JSON.parse(jsonStr);

        expect(typeof resultObj).toBe("object");
        expect(resultObj).toEqual(obj);
    });
});
