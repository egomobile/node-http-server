import { Controller, IHttpResponse } from '../../../src';
import { ControllerBase, GET } from '../../../src/controllers';
import { HttpMiddleware } from '../../types';

const middlewares: HttpMiddleware[] = [
    async (request: any, response, next) => {
        request.foo = 2;
        next();
    },
    async (request: any, response, next) => {
        request.foo += '1';
        next();
    }
];

@Controller()
export default class BazController extends ControllerBase {
    @GET({
        use: middlewares
    })
    async index(request: any, response: IHttpResponse) {
        response.write('baz:' + request.url + ':' + request.foo);
    }

    @GET({
        use: middlewares
    })
    async foo(request: any, response: IHttpResponse) {
        response.write('baz:' + request.url + ':' + request.foo);
    }

    @GET({
        path: '/bar',
        use: middlewares
    })
    async getBar(request: any, response: IHttpResponse) {
        response.write('baz:' + request.url + ':' + request.foo);
    }
}
