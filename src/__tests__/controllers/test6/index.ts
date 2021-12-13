import { Controller, IHttpResponse, NextFunction, Use } from '../../../../src';
import { ControllerBase, GET } from '../../../../src/controllers';

@Controller()
@Use(async (request: any, response: IHttpResponse, next: NextFunction) => {
    request.foo = 1;
    next();
})
export default class Test6Controller extends ControllerBase {
    @GET([async (request: any, response: any, next: NextFunction) => {
        request.foo += '1';
        next();
    }])
    async foo1(request: any, response: IHttpResponse) {
        response.write('foo1 === ' + request.foo);
    }

    @GET([async (request: any, response: any, next: NextFunction) => {
        request.foo += 2;
        next();
    }])
    async foo2(request: any, response: IHttpResponse) {
        response.write('foo2 === ' + request.foo);
    }
}
