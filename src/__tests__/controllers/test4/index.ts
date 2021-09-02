import { Controller, IHttpRequest, IHttpResponse } from '../../../../src';
import { ControllerBase, GET } from '../../../../src/controllers';
import { Serializer } from '../../../controllers/Serializer';

@Controller()
export default class Test4Controller extends ControllerBase {
    @GET('/')
    async index(request: IHttpRequest, response: IHttpResponse) {
        return {
            success: true,
            data: 'foo'
        };
    }

    @Serializer()
    async serializeResponse(result: any, request: IHttpRequest, response: IHttpResponse) {
        const jsonResponse = Buffer.from(JSON.stringify(result), 'utf8');

        response.writeHead(200, {
            'Content-Length': String(jsonResponse.length),
            'Content-Type': 'application/json; charset=utf-8'
        });
        response.write(jsonResponse);
    }
}
