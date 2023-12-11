import { Controller, ControllerParameterFormat, IHttpRequest, IHttpResponse } from "../../../../../..";
import { ControllerBase, GET } from "../../../../../../controllers";

@Controller()
export default class TestUrlParamsViaDirsController2 extends ControllerBase {
    @GET({
        "path": "/",
        "parameterFormat": ControllerParameterFormat.NextJS
    })
    async index(request: IHttpRequest, response: IHttpResponse) {
        response.write("test3:" + request.url + ":" + request.params!.test1 + " " + request.params!.test2);
    }

    @GET({
        "path": "/bar",
        "parameterFormat": ControllerParameterFormat.NextJS
    })
    async getBar(request: IHttpRequest, response: IHttpResponse) {
        response.write("test3:" + request.url + ":" + request.params!.test1 + " " + request.params!.test2);
    }
}
