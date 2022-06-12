import { AuthorizeValidator, Controller, IHttpRequest, IHttpResponse } from "../../..";
import { Authorize, ControllerBase, GET } from "../../../controllers";

function createAuthorizer(...requiredRoles: string[]): AuthorizeValidator {
    return async ({ request }) => {
        return request.authorizedUser?.roles.some((usersRole) => {
            return requiredRoles.includes(usersRole);
        }
        );
    };
}

@Controller()
@Authorize(createAuthorizer("user"))
export default class TestAuthorizeValidatorFunctionController extends ControllerBase {
    @GET()
    async user(request: IHttpRequest, response: IHttpResponse) {
        response.write("User");
    }

    @GET({
        "authorize": createAuthorizer("admin")
    })
    async admin(request: IHttpRequest, response: IHttpResponse) {
        response.write("Admin");
    }
}
