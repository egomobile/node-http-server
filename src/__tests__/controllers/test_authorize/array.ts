import { Controller, IHttpRequest, IHttpResponse } from '../../..';
import { Authorize, ControllerBase, GET } from '../../../controllers';

@Controller()
@Authorize(['user'])
export default class TestAuthorizeRoleArrayController extends ControllerBase {
    @GET()
    async user(request: IHttpRequest, response: IHttpResponse) {
        response.write('User');
    }

    @GET({
        authorize: ['admin']
    })
    async admin(request: IHttpRequest, response: IHttpResponse) {
        response.write('Admin');
    }
}
