import { Controller, IHttpResponse } from "../../..";
import { ControllerBase, GET, Import } from "../../../controllers";

@Controller()
export default class TestImportsController extends ControllerBase {
    @Import("foo")
    public foo!: string;

    @Import()
    public baz!: number;

    @GET("/")
    async index(request: any, response: IHttpResponse) {
        response.write(`FOO:(${this.foo} ${typeof this.foo}) BAZ:(${this.baz} ${typeof this.baz})`);
    }
}
