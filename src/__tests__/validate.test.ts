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
import { schema } from "..";
import { json, validate } from "../middlewares";
import { IHttpRequest, IHttpResponse, ValidationFailedHandler } from "../types";
import { binaryParser, createServer } from "./utils";

interface IMySchema {
    email: string;
    name?: string;
}

const mySchema = schema.object({
    "email": schema.string().strict().trim().email().required(),
    "name": schema.string().strict().trim().min(1).optional()
});

const validData: IMySchema[] = [{
    "email": "marcel.kloubert@e-go-mobile.com"
}, {
    "email": "marcel.kloubert@e-go-mobile.com",
    "name": "Marcel Kloubert"
}];

const invalidData: any[] = [
    {},
    { "email": 1 },
    { "email": "2" },
    { "email": true },
    { "email": null },
    { "email": undefined },
    { "email": "marcel.kloubert@e-go-mobile.com " },
    { "email": "marcel.kloubert@e-go-mobile.com", "name": "" },
    { "email": "marcel.kloubert@e-go-mobile.com", "name": " " },
    { "email": "marcel.kloubert@e-go-mobile.com", "name": null },
    { "email": "marcel.kloubert@e-go-mobile.com", "name": false },
    { "email": "marcel.kloubert@e-go-mobile.com", "name": 666 }
];

describe("validate() middleware", () => {
    ["patch", "put", "post"].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(validData)(`should return 200 when do a ${methodName} request and send valid JSON data`, async (vd) => {
            const server = createServer();
            const resultText = typeof vd;

            (server as any)[method]("/", [json(), validate(mySchema)], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(typeof req.body);
            });

            const response = await (request(server) as any)[method]("/")
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

        it.each(invalidData)(`should return 400 when do a ${methodName} request and send invalid JSON data`, async (ivd) => {
            const server = createServer();

            (server as any)[method]("/", [json(), validate(mySchema)], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(typeof req.body);
            });

            await (request(server) as any)[method]("/")
                .send(JSON.stringify(ivd))
                .parse(binaryParser)
                .expect(400);
        });

        it.each(invalidData)(`should return 403 when do a ${methodName} request and send invalid JSON data and a custom handler`, async (ivd) => {
            const server = createServer();

            const onValidationError: ValidationFailedHandler = async (ex, req, resp) => {
                const errorMessage = Buffer.from(
                    ex.message,
                    "utf8"
                );

                if (!resp.headersSent) {
                    resp.writeHead(403, {
                        "Content-Length": String(errorMessage.length)
                    });
                }

                resp.write(errorMessage);
                resp.end();
            };

            (server as any)[method]("/", [json(), validate(mySchema, onValidationError)], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(typeof req.body);
            });

            const response = await (request(server) as any)[method]("/")
                .parse(binaryParser)
                .send(JSON.stringify(ivd))
                .expect(403);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString("utf8");

            expect(typeof str).toBe("string");
            expect(str.length > 0).toBe(true);
        });
    });
});
