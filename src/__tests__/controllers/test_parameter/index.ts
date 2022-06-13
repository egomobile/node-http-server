import { Controller, IHttpRequest, IHttpResponse } from "../../..";
import { ControllerBase, GET, Parameter } from "../../../controllers";

@Controller()
export default class TestParameterController extends ControllerBase {
    @GET({
        "path": "/foo/:bar/:buzz"
    })
    async testUrl(
        request: IHttpRequest, response: IHttpResponse,
        @Parameter() bar: string,
        @Parameter({ "source": "url", "transformTo": "float" }) buzz: number
    ) {
        const str = `bar: ${bar} (${typeof bar}); buzz: ${buzz} (${typeof buzz})`;

        response.write(str);
    }

    @GET({
        "path": "/bar"
    })
    async testHeader(
        request: IHttpRequest, response: IHttpResponse,
        @Parameter({ "source": "header", "name": "x-ego-test", "transformTo": "bool" }) egoTest: string
    ) {
        const str = `x-ego-test: ${egoTest} (${typeof egoTest})`;

        response.write(str);
    }

    @GET({
        "path": "/baz"
    })
    async testQuery(
        request: IHttpRequest, response: IHttpResponse,
        @Parameter({
            "source": "query",
            "transformTo": ({ source }) => {
                return source.toUpperCase().trim();
            }
        }) testParam: string
    ) {
        const str = `testParam: ${testParam} (${typeof testParam})`;

        response.write(str);
    }
}
