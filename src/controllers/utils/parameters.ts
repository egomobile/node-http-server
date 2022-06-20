// This file is part of the @egomobile/http-server distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-server is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-server is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import type { IHttpRequest, IHttpResponse, IParameterOptionsWithHeadersSource, IParameterOptionsWithQueriesSource, IParameterOptionsWithUrlsSource, ParameterDataTransformer, ParameterDataTransformTo } from "../../types";
import type { IControllerMethodParameter, Nilable } from "../../types/internal";
import { asAsync, createObjectNameListResolver, isNil, urlSearchParamsToObject } from "../../utils";

export interface IParameterValueUpdaterContext {
    args: any[];
    request: IHttpRequest;
    response: IHttpResponse;
}

export interface IToParameterDataTransformerWithValidatorOptions {
    transformTo: Nilable<ParameterDataTransformTo>;
}

export type ParameterValueUpdater = (context: IParameterValueUpdaterContext) => Promise<any>;

export function toParameterValueUpdaters(parameters: IControllerMethodParameter[]): ParameterValueUpdater[] {
    const updaters: ParameterValueUpdater[] = [];

    parameters.forEach((p) => {
        const { index, name, options } = p;
        const source = options.source?.toLowerCase().trim() ?? "";
        const transformTo: Nilable<ParameterDataTransformTo> = (options as any).transformTo;

        if (source === "body") {
            const transformer = toParameterDataTransformerSafe({ transformTo });

            updaters.push(async ({ args, request, response }) => {
                args[index] = await transformer({
                    request, response,
                    "source": request.body
                });
            });
        }
        else if (source === "header") {
            const headerName = name.toLowerCase().trim();

            const transformer = toParameterDataTransformerSafe({ transformTo });

            updaters.push(async ({ args, request, response }) => {
                args[index] = await transformer({
                    request, response,
                    "source": request.headers[headerName]
                });
            });
        }
        else if (source === "headers") {
            const headerNames: string[] = ((options as IParameterOptionsWithHeadersSource).names ?? [])
                .map((name) => {
                    return name.toLowerCase().trim();
                });

            const getNames = createObjectNameListResolver(headerNames);
            const transformer = toParameterDataTransformerSafe({ transformTo });

            updaters.push(async ({ args, request, response }) => {
                const headers: any = {};
                for (const key of getNames(request.headers)) {
                    headers[key] = await transformer({
                        key,
                        request, response,
                        "source": request.headers[key]
                    });
                }

                args[index] = headers;
            });
        }
        else if (source === "queries") {
            const queryParamNames: string[] = [
                ...((options as IParameterOptionsWithQueriesSource).names ?? [])
            ];

            const getNames = createObjectNameListResolver(queryParamNames);
            const transformer = toParameterDataTransformerSafe({ transformTo });

            updaters.push(async ({ args, request, response }) => {
                const queryParams: any = urlSearchParamsToObject(request.query);

                const query: any = {};
                for (const key of getNames(queryParams)) {
                    query[key] = await transformer({
                        key,
                        request, response,
                        "source": queryParams![key]
                    });
                }

                args[index] = query;
            });
        }
        else if (source === "query") {
            const transformer = toParameterDataTransformerSafe({ transformTo });

            updaters.push(async ({ args, request, response }) => {
                args[index] = await transformer({
                    request, response,
                    "source": request.query?.get(name)
                });
            });
        }
        else if (source === "request") {
            updaters.push(async ({ args, request }) => {
                args[index] = request;
            });
        }
        else if (source === "response") {
            updaters.push(async ({ args, response }) => {
                args[index] = response;
            });
        }
        else if (source === "urls") {
            const urlParamNames: string[] = [
                ...((options as IParameterOptionsWithUrlsSource).names ?? [])
            ];

            const getNames = createObjectNameListResolver(urlParamNames);
            const transformer = toParameterDataTransformerSafe({ transformTo });

            updaters.push(async ({ args, request, response }) => {
                const params: any = {};
                for (const key of getNames(request.params)) {
                    params[key] = await transformer({
                        key,
                        request, response,
                        "source": request.params![key]
                    });
                }

                args[index] = params;
            });
        }
        else if (["", "url"].includes(source)) {
            const transformer = toParameterDataTransformerSafe({ transformTo });

            updaters.push(async ({ args, request, response }) => {
                args[index] = await transformer({
                    request, response,
                    "source": request.params?.[name]
                });
            });
        }
        else {
            throw new TypeError(`Source of type ${source} is not supported`);
        }
    });

    return updaters;
}

export function toParameterDataTransformerSafe({
    transformTo
}: IToParameterDataTransformerWithValidatorOptions): ParameterDataTransformer {
    let transformer: Nilable<ParameterDataTransformer>;

    if (isNil(transformTo)) {
        transformer = async ({ source }) => {
            return source;
        };
    }
    else {
        if (transformTo === "bool") {
            transformer = async ({ source }) => {
                return Boolean(String(source ?? "").toLowerCase().trim());
            };
        }
        else if (transformTo === "buffer") {
            transformer = async ({ source }) => {
                if (Buffer.isBuffer(source)) {
                    return source;
                }

                if (isNil(source)) {
                    return Buffer.alloc(0);
                }

                return Buffer.from(String(source ?? ""), "utf8");
            };
        }
        else if (transformTo === "int") {
            transformer = async ({ source }) => {
                return parseInt(String(source ?? "").trim());
            };
        }
        else if (transformTo === "float") {
            transformer = async ({ source }) => {
                return parseFloat(String(source ?? "").trim());
            };
        }
        else if (transformTo === "string") {
            transformer = async ({ source }) => {
                return String(source ?? "");
            };
        }
        else if (typeof transformTo === "function") {
            transformer = transformTo;
        }
    }

    if (typeof transformer !== "function") {
        throw new TypeError("transformTo must be of type function or a valid constant");
    }

    return asAsync<ParameterDataTransformer>(transformer);
}
