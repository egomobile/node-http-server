import { Controller, IHttpResponse, ParameterOptions } from "../../..";
import { ControllerBase, GET, Parameter, Request, Response, Use } from "../../../controllers";

const CONTEXT_KEY = Symbol("CONTEXT_KEY");

const testrQueryParamOptions: ParameterOptions = {
    "source": "query",
    "transformTo": ({ source }) => {
        return source.toUpperCase().trim();
    }
};

@Controller()
@Use(async function (request: any, response: any, next) {
    request[CONTEXT_KEY] = "request";
    response[CONTEXT_KEY] = "response";

    next();
})
export default class TestParameterController extends ControllerBase {
    @GET({
        "path": "/foo/:bar/:buzz"
    })
    async testUrl(@Response() response: IHttpResponse,
        @Parameter() bar: string,
        @Parameter({ "source": "url", "transformTo": "float" }) buzz: number
    ) {
        const str = `bar: ${bar} (${typeof bar}); buzz: ${buzz} (${typeof buzz})`;

        response.write(str);
    }

    @GET({
        "path": "/bar"
    })
    async testHeader(@Response() response: IHttpResponse,
        @Parameter({ "source": "header", "name": "x-ego-test", "transformTo": "bool" }) egoTest: string
    ) {
        const str = `x-ego-test: ${egoTest} (${typeof egoTest})`;

        response.write(str);
    }

    @GET({
        "path": "/baz"
    })
    async testQuery(@Parameter(testrQueryParamOptions) testParam: string,
        @Request() request: any, @Response() response: any,
    ) {
        let str = `testParam: ${testParam} (${typeof testParam})\n`;
        str += request[CONTEXT_KEY] + "\n";
        str += response[CONTEXT_KEY] + "\n";

        response.write(str);
    }
}
