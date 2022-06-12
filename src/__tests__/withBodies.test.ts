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
import { HttpRequestPath, IHttpRequest, IHttpResponse } from "../types";
import { readStream } from "../utils";
import { binaryParser, createServer } from "./utils";

const routePaths: HttpRequestPath[] = [
    "/",
    (request) => {
        return request.url === "/";
    },
    /^(\/)$/i
];

describe("Simple requests with common HTTP methods and input data", () => {
    ["patch", "put", "post"].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 when do a ${methodName} request and send data`, async (path) => {
            const server = createServer();
            const text = "MK+TM";

            (server as any)[method](path, async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(
                    (await readStream(req)).toString("utf8")
                );
            });

            const response = await (request(server) as any)[method]("/")
                .send(text)
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString("utf8");

            expect(typeof str).toBe("string");
            expect(str.length).toBe(text.length);
            expect(str).toBe(text);
        });

        it.each(routePaths)(`should return 404 when do a ${methodName} request and /foo route is not defined`, async (path) => {
            const server = createServer();
            const text = "MK+TM";

            (server as any)[method](path, async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(
                    (await readStream(req)).toString("utf8")
                );
            });

            const response = await (request(server) as any)[method]("/foo")
                .send(text)
                .parse(binaryParser)
                .expect(404);

            const data = response.body;

            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });

        it(`should return 404 when do a ${methodName} request and no route is defined`, async () => {
            const server = createServer();
            const text = "MK+TM";

            const response = await (request(server) as any)[method]("/")
                .send(text)
                .parse(binaryParser)
                .expect(404);

            const data = response.body;

            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });
    });
});
