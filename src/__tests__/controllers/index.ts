import { Controller, IHttpRequest, IHttpResponse } from '../../../src';
import { ControllerBase, GET } from '../../../src/controllers';

@Controller()
export default class IndexController extends ControllerBase {
    @GET()
    async index(request: IHttpRequest, response: IHttpResponse) {
        response.write('bar:' + request.url);
    }

    @GET()
    async foo(request: IHttpRequest, response: IHttpResponse) {
        response.write('bar:' + request.url);
    }

    @GET('/bar')
    async getBar(request: IHttpRequest, response: IHttpResponse) {
        response.write('bar:' + request.url);
    }
}
