import { Controller, IHttpRequest, IHttpResponse } from '../../../..';
import { ControllerBase, GET } from '../../../../controllers';

@Controller()
export default class TestUrlParamsViaDirsController extends ControllerBase {
    @GET('/')
    async index(request: IHttpRequest, response: IHttpResponse) {
        response.write('test2:' + request.url + ':' + request.params!.test);
    }

    @GET('/bar')
    async getBar(request: IHttpRequest, response: IHttpResponse) {
        response.write('test2:' + request.url + ':' + request.params!.test);
    }
}
