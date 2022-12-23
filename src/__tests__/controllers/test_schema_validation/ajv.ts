import type { ErrorObject as AjvError } from "ajv";
import assert from "assert";
import type { JSONSchema7 } from "json-schema";
import { Controller, IHttpRequest, IHttpResponse } from "../../..";
import { ControllerBase, POST } from "../../../controllers";
import { ValidationErrorHandler } from "../../../controllers/ValidationErrorHandler";

interface IMySchema {
    email: string;
    name?: string;
}

const mySchema: JSONSchema7 = {
    "type": "object",
    "required": ["email"],
    "properties": {
        "email": {
            "type": "string",
            "pattern": "^(([^<>()[\\].,;:\\s@\"]+(\\.[^<>()[\\].,;:\\s@\"]+)*)|(\".+\"))@(([^<>()[\\].,;:\\s@\"]+\\.)+[^<>()[\\].,;:\\s@\"]{2,})$",
            "minLength": 1
        },
        "name": {
            "type": "string",
            "minLength": 1,
            "pattern": "^(\\S+)(.*)(\\S*)$"
        }
    }
};

@Controller()
export default class TestAjvSchemaValidationController extends ControllerBase {
    @POST({
        "schema": mySchema
    })
    async index(request: IHttpRequest<IMySchema>, response: IHttpResponse) {
        response.write("Your input: " + JSON.stringify(request.body));
    }

    @POST({
        "path": "/foo",
        "schema": mySchema,
        "onValidationFailed": (errors, request, response) => {
            response.writeHead(409, {
                "Content-Length": "0"
            });
        }
    })
    async fooPost(request: IHttpRequest<IMySchema>, response: IHttpResponse) {
        response.write("Your foo input: " + JSON.stringify(request.body));
    }

    @ValidationErrorHandler()
    async validationFailed(errors: AjvError[], request: IHttpRequest, response: IHttpResponse) {
        assert.strictEqual(Array.isArray(errors), true);

        const errorMessage = Buffer.from("VALIDATION ERRORS: " + errors.map(error => {
            return error.message;
        }).join(), "utf8");

        response.writeHead(400, {
            "Content-Length": String(errorMessage.length)
        });
        response.write(errorMessage);
    }
}
