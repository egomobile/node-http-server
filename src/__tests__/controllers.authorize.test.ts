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
import { createServerAndInitControllers } from "./utils";

describe("Authroize feature tests (controllers)", () => {
    it.each(["admin", "user"])("should return 200 if user accesses non-restricted endpoint (role array)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/array/" + encodeURIComponent(user))
            .set("x-test-user", user)
            .send()
            .expect(200);
    });

    it.each(["admin", "user"])("should return 403 if no guest user accesses restricted endpoint (role array)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/array/" + encodeURIComponent(user))
            .send()
            .expect(403);
    });

    it.each(["admin", "user"])("should return 404 if no guest user accesses restricted endpoint with custom error handler (role array)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/custom-errors/array/" + encodeURIComponent(user))
            .send()
            .expect(404);
    });

    it.each(["admin", "user"])("should return 200 if user accesses non-restricted endpoint (filter expression)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/expression/" + encodeURIComponent(user))
            .set("x-test-user", user)
            .send()
            .expect(200);
    });

    it.each(["admin", "user"])("should return 403 if guest user tries to access restricted endpoint (filter expression)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/expression/" + encodeURIComponent(user))
            .send()
            .expect(403);
    });

    it.each(["admin", "user"])("should return 404 if guest user tries to access restricted endpoint with custom error handler (filter expression)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/custom-errors/expression/" + encodeURIComponent(user))
            .send()
            .expect(404);
    });

    it.each(["admin", "user"])("should return 200 if user accesses non-restricted endpoint (validator function)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/function/" + encodeURIComponent(user))
            .set("x-test-user", user)
            .send()
            .expect(200);
    });

    it.each(["admin", "user"])("should return 403 if guest user tries to access restricted endpoint (validator function)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/function/" + encodeURIComponent(user))
            .send()
            .expect(403);
    });

    it.each(["admin", "user"])("should return 404 if guest user tries to access restricted endpoint with custom error handler (validator function)", async (user) => {
        const server = await createServerAndInitControllers();

        await request(server).get("/test_authorize/custom-errors/function/" + encodeURIComponent(user))
            .send()
            .expect(404);
    });
});


