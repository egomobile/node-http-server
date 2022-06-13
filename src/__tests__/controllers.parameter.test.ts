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

        const url = `/test_parameter/foo/${encodeURIComponent(bar)}/${encodeURIComponent(String(buzz))}`;
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const egoTest = true;

        const url = "/test_parameter/bar";
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

        const url = `/test_parameter/baz?testParam=${encodeURIComponent(testParam)}`;
        const expectedResult = `testParam: ${testParam.toUpperCase().trim()} (${typeof testParam})`;

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
});
