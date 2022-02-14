import { Controller, IHttpRequest, IHttpResponse } from '../../..';
import { Authorize, ControllerBase, GET } from '../../../controllers';

@Controller()
@Authorize('hasRole("user")')
export default class TestAuthorizeFilterExpressionController extends ControllerBase {
    @GET()
    async user(request: IHttpRequest, response: IHttpResponse) {
        response.write('User');
    }

    @GET({
        authorize: 'hasRole("admin")'
    })
    async admin(request: IHttpRequest, response: IHttpResponse) {
        response.write('Admin');
    }
}
