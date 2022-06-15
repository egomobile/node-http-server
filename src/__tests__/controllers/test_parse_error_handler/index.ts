import { Controller, IHttpRequest, IHttpResponse, ParseError, schema } from "../../..";
import { ControllerBase, POST } from "../../../controllers";
import { BodyParseErrorHandler } from "../../../controllers/BodyParseErrorHandler";

const testSchema = schema.object({
});

@Controller()
export default class TestParseErrorHandlerController extends ControllerBase {
    @POST({
        "path": "/",
        "schema": testSchema
    })
    async index(request: IHttpRequest, response: IHttpResponse) {
        response.write("OK: " + JSON.stringify(request.body));
    }

    @BodyParseErrorHandler()
    async handleBodyParseError(error: ParseError, request: IHttpRequest, response: IHttpResponse) {
        const errorMessage = Buffer.from("ERROR: " + request.url + " " + error.innerError?.message, "utf8");

        response.writeHead(406, {
            "Content-Length": String(errorMessage.length)
        });
        response.write(errorMessage);

        response.end();
    }
}
