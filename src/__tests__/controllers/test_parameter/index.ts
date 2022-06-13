import { Controller, IHttpRequest, IHttpResponse, ParameterOptions } from "../../..";
import { ControllerBase, GET, Parameter, Request, Response, Use } from "../../../controllers";

interface IMultiHeadersParameter {
    "x-ego-1": string;
    "x-ego-2": number;
    "x-ego-3": number;
}

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

    @GET({
        "path": "/buzz"
    })
    async testMultiHeaders(
        request: IHttpRequest, response: IHttpResponse,
        @Parameter({
            "source": "headers",
            "names": ["x-ego-1", "x-ego-2", "x-ego-3"],
            "transformTo": (({ key, source }) => {
                if (key === "x-ego-2") {
                    return parseFloat(source);
                }
                else if (key === "x-ego-3") {
                    return Boolean(source);
                }

                return source;
            })
        }) headers: IMultiHeadersParameter
    ) {
        let str = `${headers["x-ego-1"]} (${typeof headers["x-ego-1"]})\n`;
        str += `${headers["x-ego-2"]} (${typeof headers["x-ego-2"]})\n`;
        str += `${headers["x-ego-3"]} (${typeof headers["x-ego-3"]})\n`;

        response.write(str);
    }
}
