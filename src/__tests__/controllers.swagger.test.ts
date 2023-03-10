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
import { URLSearchParams } from "url";
import { binaryParser, createServerAndInitControllers } from "./utils";

const validData: any[] = [{
    "foo": ""
}, {
    "foo": "bar"
}];

const invalidData: any[] = [{}, {
    "bar": "0"
}];

function toQueryString(obj: any): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
        params.set(key, String(value));
    }

    return params.toString();
}

describe("Swagger validation feature tests (controllers)", () => {
    ["get"].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(validData)(`should return 200 when do a ${methodName} request and send valid query params`, async (vd) => {
            const resultText = "ok";

            const server = await createServerAndInitControllers();

            const response = await (request(server) as any)[method]("/test_swagger/test1?" + toQueryString(vd))
                .send(JSON.stringify(vd))
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString("utf8");

            expect(typeof str).toBe("string");
            expect(str.length).toBe(resultText.length);
            expect(str).toBe(resultText);
        });

        it.each(invalidData)(`should return 400 when do a ${methodName} request and send invalid query params`, async (ivd) => {
            const server = await createServerAndInitControllers();

            await (request(server) as any)[method]("/test_swagger/test1?" + toQueryString(ivd))
                .send(JSON.stringify(ivd))
                .parse(binaryParser)
                .expect(400);
        });

        it.each(invalidData)(`should return 403 when do a ${methodName} request and send invalid query params and a custom handler`, async (ivd) => {
            const server = await createServerAndInitControllers();

            const response = await (request(server) as any)[method]("/test_swagger/test2?" + toQueryString(ivd))
                .send(JSON.stringify(ivd))
                .parse(binaryParser)
                .expect(403);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString("utf8");

            expect(typeof str).toBe("string");
            expect(str.length > 0).toBe(true);
        });
    });
});
