import { isSchema } from "joi";
import { createBodyParserMiddlewareByFormat } from ".";
import { PARSE_ERROR_HANDLER, VALIDATION_ERROR_HANDLER } from "../../constants";
import { defaultParseErrorHandler, defaultValidationFailedHandler, json, validate, validateAjv } from "../../middlewares";
import { HttpInputDataFormat, HttpMiddleware, IControllerRouteWithBodyOptions, IControllersOptions, IHttpController, IHttpServer, SchemaValidationFailedHandler, ValidationFailedHandler } from "../../types";
import type { Nilable } from "../../types/internal";
import { asAsync, isNil } from "../../utils";

export interface ISetupMiddlewaresByJoiSchemaOptions {
    controller: IHttpController<IHttpServer>;
    decoratorOptions: Nilable<IControllerRouteWithBodyOptions>;
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
        // Joi schema

        const validationErrorHandler =
            createWrappedValidationErrorHandler(
                decoratorOptions.onValidationFailed ||
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
        // JSON / Ajv schema

        const validationErrorHandler =
            createWrappedSchemaValidationErrorHandler(
                decoratorOptions.onValidationFailed ||
                (controller as any)[VALIDATION_ERROR_HANDLER] ||
                globalOptions?.onSchemaValidationFailed
            ) || defaultValidationFailedHandler;

        middlewares.push(
            createDataParser(),
            validateAjv(schema, {
                "onValidationFailed": validationErrorHandler as any
            })
        );
    }
}

