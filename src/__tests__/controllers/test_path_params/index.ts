import { Controller, IHttpRequest, IHttpResponse } from '../../..';
import { ControllerBase, GET } from '../../../controllers';

@Controller()
export default class TestUrlParamsController extends ControllerBase {
    @GET('/:test')
    async index(request: IHttpRequest, response: IHttpResponse) {
        response.write('test:' + request.url + ':' + request.params!.test);
    }

    @GET('/:test/bar')
    async getBar(request: IHttpRequest, response: IHttpResponse) {
        response.write('test:' + request.url + ':' + request.params!.test);
    }
}
