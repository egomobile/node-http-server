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

describe("Deprecated feature tests (controllers)", () => {
    it("should return 410 if try to access /test1 endpoint with default 'deprecated' settings", async () => {
        const server = createServerAndInitControllers();

        await request(server).get("/test_deprecated/test1")
            .send()
            .expect(410);
    });

    it("should return 503 if try to access /test2 endpoint with custom 'deprecated' settings", async () => {
        const expectedResult = "DePrEcAteD";

        const server = createServerAndInitControllers();

        const response = await request(server).get("/test_deprecated/test2")
            .send()
            .parse(binaryParser)
            .expect(503);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString("utf8");

        expect(typeof str).toBe("string");
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });
});
