import { Controller, IHttpRequest, IHttpResponse } from "../../..";
import { ControllerBase, GET } from "../../../controllers";
import { Serializer } from "../../../controllers/Serializer";

@Controller()
export default class TestSerializerController extends ControllerBase {
    @GET("/")
    async index(request: IHttpRequest, response: IHttpResponse) {
        return {
            "success": true,
            "data": "foo"
        };
    }

    @Serializer()
    async serializeResponse(result: any, request: IHttpRequest, response: IHttpResponse) {
        const jsonResponse = Buffer.from(JSON.stringify(result), "utf8");

        response.writeHead(200, {
            "Content-Length": String(jsonResponse.length),
            "Content-Type": "application/json; charset=UTF-8"
        });
        response.write(jsonResponse);
    }
}
