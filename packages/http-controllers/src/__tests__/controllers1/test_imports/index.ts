/* eslint-disable @typescript-eslint/naming-convention */

import type { IHttp1Request, IHttp1Response } from "@egomobile/http-server";
import assert from "assert";
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
    public async index(request: IHttp1Request, response: IHttp1Response) {
        assert.strictEqual(this instanceof ImportsController, true);

        response.end(`${this.foo} ${this.bar} ${this.getBuzz()}`);
    }
}
