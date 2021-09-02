import { Controller, IHttpRequest, IHttpResponse } from '../../../../../src';
import { ControllerBase, GET } from '../../../../../src/controllers';

@Controller()
export default class Test2Controller extends ControllerBase {
    @GET('/')
    async index(request: IHttpRequest, response: IHttpResponse) {
        response.write('test2:' + request.url + ':' + request.params!.test3);
    }

    @GET('/bar')
    async getBar(request: IHttpRequest, response: IHttpResponse) {
        response.write('test2:' + request.url + ':' + request.params!.test3);
    }
}
