import { AuthorizeValidationFailedHandler, Controller, IHttpRequest, IHttpResponse } from '../../../..';
import { Authorize, ControllerBase, GET } from '../../../../controllers';

const onValidationFailed: AuthorizeValidationFailedHandler = async (reason, request, response) => {
    const errorMessage = Buffer.from(String(reason), 'utf-8');

    if (!response.headersSent) {
        response.writeHead(404, {
            'Content-Length': String(errorMessage.length)
        });
    }

    response.write(errorMessage);
};

@Controller()
@Authorize('hasRole("user")', onValidationFailed)
export default class TestAuthorizeFilterExpressionWithCustomErrorsController extends ControllerBase {
    @GET()
    async user(request: IHttpRequest, response: IHttpResponse) {
        response.write('User');
    }

    @GET({
        authorize: {
            onValidationFailed,
            validator: 'hasRole("admin")'
        }
    })
    async admin(request: IHttpRequest, response: IHttpResponse) {
        response.write('Admin');
    }
}
