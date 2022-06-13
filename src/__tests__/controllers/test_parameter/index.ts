import { Controller, IHttpRequest, IHttpResponse, ParameterOptions } from "../../..";
import { ControllerBase, GET, Parameter, Request, Response, Use } from "../../../controllers";

interface IMultiHeadersParameter {
    "x-ego-1": string;
    "x-ego-2": number;
    "x-ego-3": number;
}

interface IMultiQueryParameter {
    "xEgo1": string;
    "xEgo2": number;
    "xEgo3": number;
}

const CONTEXT_KEY = Symbol("CONTEXT_KEY");

const testQueryParamOptions: ParameterOptions = {
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
        "path": "/url/:bar/:buzz"
    })
    async testUrl(@Response() response: IHttpResponse,
        @Parameter() bar: string,
        @Parameter({ "source": "url", "transformTo": "float" }) buzz: number
    ) {
        const str = `bar: ${bar} (${typeof bar}); buzz: ${buzz} (${typeof buzz})`;

        response.write(str);
    }

    @GET({
        "path": "/header"
    })
    async testHeader(@Response() response: IHttpResponse,
        @Parameter({ "source": "header", "name": "x-ego-test", "transformTo": "bool" }) egoTest: string
    ) {
        const str = `x-ego-test: ${egoTest} (${typeof egoTest})`;

        response.write(str);
    }

    @GET({
        "path": "/query"
    })
    async testQuery(@Parameter(testQueryParamOptions) testParam: string,
        @Request() request: any, @Response() response: any,
    ) {
        let str = `testParam: ${testParam} (${typeof testParam})\n`;
        str += request[CONTEXT_KEY] + "\n";
        str += response[CONTEXT_KEY] + "\n";

        response.write(str);
    }

    @GET({
        "path": "/multi-query"
    })
    async testMultiQuery(
        request: IHttpRequest, response: IHttpResponse,
        @Parameter({
            "source": "queries",
            "names": ["xEgo1", "xEgo2", "xEgo3"],
            "transformTo": (({ key, source }) => {
                if (key === "xEgo2") {
                    return parseFloat(source);
                }
                else if (key === "xEgo3") {
                    return Boolean(source);
                }

                return source;
            })
        }) query: IMultiQueryParameter
    ) {
        let str = `${query["xEgo1"]} (${typeof query["xEgo1"]})\n`;
        str += `${query["xEgo2"]} (${typeof query["xEgo2"]})\n`;
        str += `${query["xEgo3"]} (${typeof query["xEgo3"]})\n`;

        response.write(str);
    }

    @GET({
        "path": "/multi-headers"
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
