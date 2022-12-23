import { isSchema } from "joi";
import { createBodyParserMiddlewareByFormat } from ".";
import { PARSE_ERROR_HANDLER, VALIDATION_ERROR_HANDLER } from "../../constants";
import { defaultParseErrorHandler, defaultSchemaValidationFailedHandler, defaultValidationFailedHandler, json, validate, validateAjv } from "../../middlewares";
import { ControllerRouteWithBodyOptions, HttpInputDataFormat, HttpMiddleware, IControllerRouteWithBodyAndJoiSchemaOptions, IControllerRouteWithBodyAndJsonSchemaOptions, IControllersOptions, IHttpController, IHttpServer, SchemaValidationFailedHandler, ValidationFailedHandler } from "../../types";
import type { Nilable } from "../../types/internal";
import { asAsync, isNil } from "../../utils";

export interface ISetupMiddlewaresByJoiSchemaOptions {
    controller: IHttpController<IHttpServer>;
    decoratorOptions: Nilable<ControllerRouteWithBodyOptions>;
    globalOptions: Nilable<IControllersOptions>;
    middlewares: HttpMiddleware[];
    throwIfOptionsIncompatibleWithHTTPMethod: () => any;
}

function createWrappedSchemaValidationErrorHandler(handler: Nilable<SchemaValidationFailedHandler>): Nilable<SchemaValidationFailedHandler> {
    if (isNil(handler)) {
        return handler;
    }

    handler = asAsync<SchemaValidationFailedHandler>(handler);

    return async (error, request, response) => {
        await handler!(error, request, response);

        response.end();
    };
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

export function setupMiddlewaresBySchema({
    controller,
    decoratorOptions,
    globalOptions,
    middlewares,
    throwIfOptionsIncompatibleWithHTTPMethod
}: ISetupMiddlewaresByJoiSchemaOptions) {
    const schema = decoratorOptions?.schema;
    if (!schema) {
        return;
    }

    throwIfOptionsIncompatibleWithHTTPMethod();

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

    if (isSchema(schema)) {
        const optionsForJoiSchema = decoratorOptions as IControllerRouteWithBodyAndJoiSchemaOptions;

        const validationErrorHandler =
            createWrappedValidationErrorHandler(
                optionsForJoiSchema.onValidationFailed ||
                (controller as any)[VALIDATION_ERROR_HANDLER] ||
                globalOptions?.onSchemaValidationFailed
            ) || defaultValidationFailedHandler;

        middlewares.push(
            createDataParser(),
            validate(schema, {
                "onValidationFailed": validationErrorHandler
            })
        );
    }
    else {
        const optionsForJsonSchema = decoratorOptions as IControllerRouteWithBodyAndJsonSchemaOptions;

        const validationErrorHandler =
            createWrappedSchemaValidationErrorHandler(
                optionsForJsonSchema.onValidationFailed ||
                (controller as any)[VALIDATION_ERROR_HANDLER] ||
                globalOptions?.onSchemaValidationFailed
            ) || defaultSchemaValidationFailedHandler;

        middlewares.push(
            createDataParser(),
            validateAjv(schema, {
                "onValidationFailed": validationErrorHandler
            })
        );
    }
}

