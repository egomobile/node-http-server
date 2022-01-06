import { Controller, IHttpResponse } from '../../../../src';
import { ControllerBase, GET, Import } from '../../../../src/controllers';

@Controller()
export default class Test7Controller extends ControllerBase {
    @Import('foo')
    public foo!: string;

    @Import()
    public baz!: number;

    @GET('/')
    async index(request: any, response: IHttpResponse) {
        response.write(`FOO:(${this.foo} ${typeof this.foo}) BAZ:(${this.baz} ${typeof this.baz})`);
    }
}
