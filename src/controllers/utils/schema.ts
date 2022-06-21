import { createBodyParserMiddlewareByFormat } from ".";
import { PARSE_ERROR_HANDLER, VALIDATION_ERROR_HANDLER } from "../../constants";
import { defaultParseErrorHandler, defaultValidationFailedHandler, json, validate } from "../../middlewares";
import { HttpInputDataFormat, HttpMiddleware, IControllerRouteWithBodyOptions, IControllersOptions, IHttpController, IHttpServer, ValidationFailedHandler } from "../../types";
import { Nilable } from "../../types/internal";
import { asAsync, isNil } from "../../utils";

export interface ISetupMiddlewaresByJoiSchemaOptions {
    controller: IHttpController<IHttpServer>;
    decoratorOptions: Nilable<IControllerRouteWithBodyOptions>;
    globalOptions: Nilable<IControllersOptions>;
    middlewares: HttpMiddleware[];
    throwIfOptionsIncompatibleWithHTTPMethod: () => any;
}

function createWrappedValidationErrorHandler(handler: Nilable<ValidationFailedHandler>): Nilable<ValidationFailedHandler> {
    if (isNil(handler)) {
        return handler;
    }

    handler = asAsync<ValidationFailedHandler>(handler);

    return async (error, request, response) => {
        await handler!(error, request, response);

        response.end();
    };
}

export function setupMiddlewaresByJoiSchema({
    controller,
    decoratorOptions,
    globalOptions,
    middlewares,
    throwIfOptionsIncompatibleWithHTTPMethod
}: ISetupMiddlewaresByJoiSchemaOptions) {
    if (!decoratorOptions?.schema) {
        return;
    }

    throwIfOptionsIncompatibleWithHTTPMethod();

    const validationErrorHandler =
        createWrappedValidationErrorHandler(
            decoratorOptions.onValidationFailed ||
            (controller as any)[VALIDATION_ERROR_HANDLER] ||
            globalOptions?.onSchemaValidationFailed
        ) || defaultValidationFailedHandler;

    const parseErrorHandler = (
        decoratorOptions.onParsingFailed ||
        (controller as any)[PARSE_ERROR_HANDLER] ||
        globalOptions?.onParsingFailed
    ) || defaultParseErrorHandler;

    const createDataParser: () => HttpMiddleware = isNil(decoratorOptions?.format) ?
        () => {
            return json({
                "limit": decoratorOptions.limit,
                "onParsingFailed": parseErrorHandler
            });
        } :
        () => {
            return createBodyParserMiddlewareByFormat(decoratorOptions.format || HttpInputDataFormat.JSON, {
                "limit": decoratorOptions.limit,
                "onParsingFailed": parseErrorHandler
            });
        };

    middlewares.push(
        createDataParser(),
        validate(decoratorOptions.schema, {
            "onValidationFailed": validationErrorHandler
        })
    );
}

