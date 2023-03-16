/* eslint-disable @typescript-eslint/naming-convention */

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
export default class IndexController {
    @GET()
    public async test1(request: any, response: any) {
        response.end(request.foo);
    }

    @GET([middleware2])
    public async test2(request: any, response: any) {
        response.end(request.foo);
    }
}
