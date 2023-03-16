/* eslint-disable @typescript-eslint/naming-convention */

import type { IHttp1Request, IHttp1Response } from "@egomobile/http-server";
const { Controller, GET } = require("../../../lib/index.cjs");

@Controller()
export default class IndexController {
    @GET()
    public async index(request: IHttp1Request, response: IHttp1Response) {
        response.end("OK");
    }
}
