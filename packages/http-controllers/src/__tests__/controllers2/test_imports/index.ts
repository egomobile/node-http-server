/* eslint-disable @typescript-eslint/naming-convention */

import type { IHttp2Request, IHttp2Response } from "@egomobile/http-server";
const { Controller, GET, Import } = require("../../../../lib/index.cjs");

@Controller()
export default class ImportsController {
    @Import()
    public foo!: string;

    @Import()
    public bar!: number;

    @Import('buzz')
    public getBuzz!: () => string;

    @GET()
    public async index(request: IHttp2Request, response: IHttp2Response) {
        response.end(`${this.foo} ${this.bar} ${this.getBuzz()}`);
    }
}
