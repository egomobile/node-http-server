import { Controller, IHttpRequest, IHttpResponse } from '../../../../src';
import { ControllerBase, GET } from '../../../../src/controllers';
import { ErrorHandler } from '../../../controllers/ErrorHandler';

@Controller()
export default class Test3Controller extends ControllerBase {
    @GET('/')
    async index(request: IHttpRequest, response: IHttpResponse) {
        throw new Error('Something went wrong!');
    }

    @ErrorHandler()
    async handleError(error: any, request: IHttpRequest, response: IHttpResponse) {
        const errorMessage = Buffer.from('ERROR: ' + request.url + ' ' + error.message, 'utf8');

        response.writeHead(400, {
            'Content-Length': String(errorMessage.length)
        });
        response.write(errorMessage);

        response.end();
    }
}
