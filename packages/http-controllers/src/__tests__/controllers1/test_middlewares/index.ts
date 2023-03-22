/* eslint-disable @typescript-eslint/naming-convention */

import assert from "assert";

const { Controller, GET, Use } = require("../../../../lib/index.cjs");

const middleware1 = async (request: any, response: any, next: any) => {
    request.foo = "1";

    next();
};

const middleware2 = async (request: any, response: any, next: any) => {
    request.foo += "2";

    next();
};

@Controller()
@Use(middleware1)
export default class MiddlewareController {
    @GET()
    public async test1(request: any, response: any) {
        assert.strictEqual(this instanceof MiddlewareController, true);

        response.end(request.foo);
    }

    @GET([middleware2])
    public async test2(request: any, response: any) {
        assert.strictEqual(this instanceof MiddlewareController, true);

        response.end(request.foo);
    }
}
