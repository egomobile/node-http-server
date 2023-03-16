/* eslint-disable @typescript-eslint/naming-convention */

import type { IHttp2Request, IHttp2Response } from "@egomobile/http-server";
const { Controller, GET } = require("../../../lib/index.cjs");

@Controller()
export default class IndexController {
    @GET()
    public async index(request: IHttp2Request, response: IHttp2Response) {
        response.end("OK");
    }
}
