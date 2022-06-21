import { Controller, IHttpRequest, IHttpResponse, JsonSchemaValidationFailedHandler } from "../../..";
import { ControllerBase, GET } from "../../../controllers";

const onValidationWithDocumentationFailed: JsonSchemaValidationFailedHandler = async (errors, req, resp) => {
    const errorMessage = Buffer.from(
        errors.map((error) => {
            return error.message;
        }).join(", "),
        "utf8"
    );

    if (!resp.headersSent) {
        resp.writeHead(403, {
            "Content-Length": String(errorMessage.length)
        });
    }

    resp.write(errorMessage);
    resp.end();
};

@Controller()
export default class TestSwaggerController extends ControllerBase {
    @GET({
        "path": "/test1",
        "documentation": {
            "parameters": [
                {
                    "in": "query",
                    "name": "foo",
                    "required": true
                }
            ],
            "responses": {}
        },
        "validateWithDocumentation": true
    })
    async test1(request: IHttpRequest, response: IHttpResponse) {
        response.write("ok");
    }

    @GET({
        "path": "/test2",
        "documentation": {
            "parameters": [
                {
                    "in": "query",
                    "name": "foo",
                    "required": true
                }
            ],
            "responses": {}
        },
        onValidationWithDocumentationFailed,
        "validateWithDocumentation": true
    })
    async test2(request: IHttpRequest, response: IHttpResponse) {
        response.write("ok");
    }
}
