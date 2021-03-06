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
import { cookies } from "../middlewares";
import { HttpRequestPath, IHttpRequest, IHttpResponse } from "../types";
import { binaryParser, createServer } from "./utils";

const routePaths: HttpRequestPath[] = [
    "/",
    (request) => {
        return request.url === "/";
    },
    /^(\/)$/i
];

describe("Simple request with cookies", () => {
    ["get", "delete", "options", "patch", "put", "post", "trace"].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 when do a ${methodName} request with a 'bar' query parameter in URL`, async (path) => {
            const expectedResult = "object:foo=bar;baz=MKTM";

            const server = createServer();

            (server as any)[method](path, [cookies()], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(
                    `${typeof req.cookies}:foo=${req.cookies!.foo};baz=${req.cookies!.baz}`
                );
            });

            const response = await (request(server) as any)[method]("/")
                .set("Cookie", "foo=bar; baz=MKTM")
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
});
