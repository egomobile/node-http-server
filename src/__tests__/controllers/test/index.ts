import { Controller, IHttpRequest, IHttpResponse } from '../../../../src';
import { ControllerBase, GET } from '../../../../src/controllers';

@Controller()
export default class TestController extends ControllerBase {
    @GET('/:test')
    async index(request: IHttpRequest, response: IHttpResponse) {
        response.write('test:' + request.url + ':' + request.params!.test);
    }

    @GET('/:test/bar')
    async getBar(request: IHttpRequest, response: IHttpResponse) {
        response.write('test:' + request.url + ':' + request.params!.test);
    }
}
