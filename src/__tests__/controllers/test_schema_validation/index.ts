import { Controller, IHttpRequest, IHttpResponse, JoiValidationError, schema } from "../../..";
import { ControllerBase, POST } from "../../../controllers";
import { ValidationErrorHandler } from "../../../controllers/ValidationErrorHandler";

interface IMySchema {
    email: string;
    name?: string;
}

const mySchema = schema.object({
    "email": schema.string().strict().trim().email().required(),
    "name": schema.string().strict().trim().min(1).optional()
});

@Controller()
export default class TestSchemaValidationController extends ControllerBase {
    @POST(mySchema)
    async index(request: IHttpRequest<IMySchema>, response: IHttpResponse) {
        response.write("Your input: " + JSON.stringify(request.body));
    }

    @POST({
        "path": "/foo",
        "schema": mySchema,
        "onValidationFailed": (error, request, response) => {
            response.writeHead(409, {
                "Content-Length": "0"
            });
        }
    })
    async fooPost(request: IHttpRequest<IMySchema>, response: IHttpResponse) {
        response.write("Your foo input: " + JSON.stringify(request.body));
    }

    @ValidationErrorHandler()
    async validationFailed(error: JoiValidationError, request: IHttpRequest, response: IHttpResponse) {
        const errorMessage = Buffer.from("VALIDATION ERROR: " + error.message, "utf8");

        response.writeHead(400, {
            "Content-Length": String(errorMessage.length)
        });
        response.write(errorMessage);
    }
}
