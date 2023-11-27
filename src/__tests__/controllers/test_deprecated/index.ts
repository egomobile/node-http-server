import { Controller, IHttpRequest, IHttpResponse } from "../../..";
import { ControllerBase, GET } from "../../../controllers";

@Controller()
export default class TestDepreactedController extends ControllerBase {
    @GET({
        "path": "/test1",
        "deprecated": true
    })
    async test1(request: IHttpRequest, response: IHttpResponse) {
        response.write("OK");
    }

    @GET({
        "path": "/test2",
        "deprecated": {
            "onDeprecated": async (request, response) => {
                response.writeHead(503);
                response.end("DePrEcAteD");
            }
        }
    })
    async test2(request: IHttpRequest, response: IHttpResponse) {
        response.write("OK");
    }
}
