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

import path from "path";
import { Response } from "supertest";
import createHttpServer, { ICreateServerOptions, IHttpServer } from "..";
import { Nilable } from "../types/internal";

export function binaryParser(response: Response, done: (ex: any, data?: Buffer) => any) {
    response.setEncoding("binary");

    let data = "";

    response.once("error", (error: any) => {
        done(error);
    });

    response.on("data", (chunk: string) => {
        data += chunk;
    });

    response.once("end", () => {
        done(null, Buffer.from(data, "binary"));
    });
}

export function createServer(serverOptions?: Nilable<ICreateServerOptions>): IHttpServer {
    return createHttpServer(serverOptions);
}

export function createServerAndInitControllers() {
    const server = createServer({
        "tests": {
            "requiresTestsEverywhere": false
        }
    });

    server.controllers({
        "rootDir": path.join(__dirname, "controllers"),
        "imports": {
            "foo": () => {
                return "bar";
            },
            "baz": 42
        },
        "authorize": {
            "findAuthorizedUser": async ({ request }) => {
                if (request.headers["x-test-user"] === "user") {
                    return {
                        "roles": ["user"]
                    };
                }

                if (request.headers["x-test-user"] === "admin") {
                    return {
                        "roles": ["admin"]
                    };
                }
            }
        }
    });

    return server;
}
