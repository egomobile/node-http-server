import { AuthorizeValidationFailedHandler, AuthorizeValidator, Controller, IHttpRequest, IHttpResponse } from "../../../..";
import { Authorize, ControllerBase, GET } from "../../../../controllers";

function createAuthorizer(...requiredRoles: string[]): AuthorizeValidator {
    return async ({ request }) => {
        return request.authorizedUser?.roles.some((usersRole) => {
            return requiredRoles.includes(usersRole);
        }
        );
    };
}

const onValidationFailed: AuthorizeValidationFailedHandler = async (reason, request, response) => {
    const errorMessage = Buffer.from(String(reason), "utf-8");

    if (!response.headersSent) {
        response.writeHead(404, {
            "Content-Length": String(errorMessage.length)
        });
    }

    response.write(errorMessage);
};

@Controller()
@Authorize(createAuthorizer("user"), onValidationFailed)
export default class TestAuthorizeValidatorFunctionWithCustomErrorsController extends ControllerBase {
    @GET()
    async user(request: IHttpRequest, response: IHttpResponse) {
        response.write("User");
    }

    @GET({
        "authorize": {
            "validator": createAuthorizer("admin"),
            onValidationFailed
        }
    })
    async admin(request: IHttpRequest, response: IHttpResponse) {
        response.write("Admin");
    }
}
