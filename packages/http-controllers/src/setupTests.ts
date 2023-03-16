// This file is part of the @egomobile/http-controllers distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-controllers is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-controllers is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import createServer, { IHttp1Server, IHttp2Server } from "@egomobile/http-server";
import path from "node:path";
const { extendWithControllers } = require("../lib/index.cjs");

let httpServer1!: IHttp1Server;
let httpServer2!: IHttp2Server;

beforeAll(async () => {
    // something, that should be invoked before the first test

    (global as any).httpServer1 = httpServer1 = createServer(1);
    (global as any).httpServer2 = httpServer2 = createServer(2);

    httpServer1.extend(extendWithControllers());
    httpServer2.extend(extendWithControllers());

    await httpServer1.controllers({
        "rootDir": path.join(__dirname, "/__tests__/controllers1"),
        "patterns": ["**/*.ts"]
    });
    await httpServer2.controllers({
        "rootDir": path.join(__dirname, "/__tests__/controllers2"),
        "patterns": ["**/*.ts"]
    });
});

beforeEach(async () => {
    // something, that should be invoked before any test
});

afterEach(() => {
    // something, that should be invoked after any test
});

afterAll(async () => {
    // something, that should be invoked after the last test
});