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

import fs from "fs";
import yaml from "js-yaml";
import type { OpenAPIV3 } from "openapi-types";
import path from "path";
import { knownFileMimes } from "../constants";
import { normalizeRouterPath } from "../controllers/utils";
import type { HttpMethod, IControllerMethodInfo, IControllersSwaggerOptions, IHttpServer } from "../types";
import type { Nilable, ResolveSwaggerOperationObject } from "../types/internal";
import { clone, isNil, loadModule, setupObjectProperty, walkDirSync } from "../utils";
import swaggerInitializerJs from "./resources/swagger-initializer_js";
import { createSwaggerPathValidator, getSwaggerDocsBasePath, toOperationObject, toSwaggerPath } from "./utils";

export interface IPrepareSwaggerDocumentFromOpenAPIFilesOptions {
    controllersRootDir: string;
    document: OpenAPIV3.Document;
    doesScriptFileMatch: (file: string) => boolean;
    methods: IControllerMethodInfo[];
    resolveOperation: ResolveSwaggerOperationObject;
}

export interface IPrepareSwaggerDocumentFromResourcesOptions {
    document: OpenAPIV3.Document;
    doesScriptFileMatch: (file: string) => boolean;
    methods: IControllerMethodInfo[];
    resolveOperation: ResolveSwaggerOperationObject;
    resourcePath: string;
}

export interface ISetupSwaggerUIForServerControllersOptions {
    document: OpenAPIV3.Document;
    options: IControllersSwaggerOptions;
    server: IHttpServer;
}

interface IUpdateOperationObject {
    document: OpenAPIV3.Document;
    httpMethod: HttpMethod;
    operation: Nilable<OpenAPIV3.OperationObject>;
    rawPath: string;
    resolveOperation: ResolveSwaggerOperationObject;
}

const componentKeys: (keyof OpenAPIV3.ComponentsObject)[] = [
    "callbacks",
    "examples",
    "headers",
    "links",
    "parameters",
    "requestBodies",
    "responses",
    "schemas",
    "securitySchemes"
];

const pathToSwaggerUi: string = require("swagger-ui-dist").absolutePath();

const indexHtmlFilePath = path.join(pathToSwaggerUi, "index.html");
const swaggerInitializerJSFilePath = path.join(pathToSwaggerUi, "swagger-initializer.js");

const { readFile, stat } = fs.promises;

export function prepareSwaggerDocumentFromOpenAPIFiles({
    controllersRootDir,
    document,
    doesScriptFileMatch,
    methods,
    resolveOperation
}: IPrepareSwaggerDocumentFromOpenAPIFilesOptions) {
    walkDirSync(controllersRootDir, (file) => {
        if (!doesScriptFileMatch(file)) {
            return;  // this is no file, we can use as script
        }

        const relativeResourcePath = normalizeRouterPath(
            path.relative(controllersRootDir, file)
        );

        const allMatchingMethods = methods.filter(({ controller }) => {
            return relativeResourcePath === controller.__path;
        });

        for (const matchingMethod of allMatchingMethods) {
            const {
                controller,
                "method": httpMethod,
                "name":
                methodName,
                rawPath
            } = matchingMethod;

            const controllerDir = path.dirname(controller.__file);
            const controllerFileExt = path.extname(controller.__file);
            const controllerBasename = path.basename(controller.__file, controllerFileExt);
            const controllerOpenAPIFile = path.join(controllerDir, controllerBasename + ".openapi" + controllerFileExt);

            if (!fs.existsSync(controllerOpenAPIFile)) {
                continue;
            }

            const stat = fs.statSync(controllerOpenAPIFile);
            if (!stat.isFile()) {
                throw new Error(`${controllerOpenAPIFile} is no file`);
            }

            const controllerOpenApiModule = require(controllerOpenAPIFile);

            // try to find an export, with the exact the same name / key
            // as the underlying controller method
            const operationOrGetter = controllerOpenApiModule?.[methodName];
            const operation = toOperationObject(operationOrGetter);

            updateOperationObject({
                document,
                httpMethod,
                operation,
                rawPath,
                resolveOperation
            });
        }
    });
}

export function prepareSwaggerDocumentFromResources({
    document,
    doesScriptFileMatch,
    methods,
    resolveOperation,
    resourcePath
}: IPrepareSwaggerDocumentFromResourcesOptions) {
    if (!fs.existsSync(resourcePath)) {
        throw new Error(`Swagger resource directory ${resourcePath} not found`);
    }

    // initialize, if needed
    if (!document.components) {
        document.components = {};
    }
    if (!document.paths) {
        document.paths = {};
    }

    // load components
    const componentsDir = path.join(resourcePath, "components");
    if (fs.existsSync(componentsDir)) {
        // load components, if exist

        for (const key of componentKeys) {
            const componentTypeDir = path.join(componentsDir, key);
            if (!fs.existsSync(componentTypeDir)) {
                continue;
            }

            const fStat = fs.statSync(componentTypeDir);
            if (!fStat.isDirectory()) {
                throw new Error(`${componentTypeDir} is not directory`);
            }

            if (!document.components[key]) {
                document.components[key] = {};
            }

            walkDirSync(componentTypeDir, (file) => {
                if (!doesScriptFileMatch(file)) {
                    return;  // this is no file, we can use as script
                }

                const componentName = path.basename(file, path.extname(file));
                const component = loadModule(file, true);

                setupObjectProperty<any>(document.components![key], componentName, component);
            }, false);
        }
    }

    // load path operations
    const pathsDir = path.join(resourcePath, "paths");
    if (fs.existsSync(pathsDir)) {
        // load paths, if exist

        walkDirSync(pathsDir, (file) => {
            if (!doesScriptFileMatch(file)) {
                return;  // this is no file, we can use as script
            }

            const relativeResourcePath = normalizeRouterPath(
                path.relative(pathsDir, file)
            );

            const allMatchingMethods = methods.filter(({ controller }) => {
                return relativeResourcePath === controller.__path;
            });

            for (const matchingMethod of allMatchingMethods) {
                const {
                    "method": httpMethod,
                    "name": methodName,
                    rawPath
                } = matchingMethod;
                const pathModule = loadModule(file, true);

                // try to find an export, with the exact the same name / key
                // as the underlying controller method
                const operationOrGetter = pathModule?.[methodName];
                const operation = toOperationObject(operationOrGetter);

                updateOperationObject({
                    document,
                    httpMethod,
                    operation,
                    rawPath,
                    resolveOperation
                });
            }
        });
    }
}

export function setupSwaggerUIForServerControllers({
    document,
    server,
    options
}: ISetupSwaggerUIForServerControllersOptions) {
    const basePath = getSwaggerDocsBasePath(options.basePath);
    const basePathWithSuffix = basePath + (basePath.endsWith("/") ? "" : "/");

    const documentJson = options.noJSON ?
        null :
        Buffer.from(JSON.stringify(document), "utf8");
    const documentYAML = options.noYAML ?
        null :
        Buffer.from(yaml.dump(document), "utf8");

    // keep sure we have a clean copy here
    document = clone(document);

    const swaggerInitializerJSContent = Buffer.from(swaggerInitializerJs(), "utf8");

    server.get(createSwaggerPathValidator(options.basePath), options.use ?? [], async (request, response) => {
        try {
            if (request.url === basePath) {
                response.writeHead(301, {
                    "Content-Length": "0",
                    "Location": basePathWithSuffix
                });

                return;
            }

            let fileOrDir = normalizeRouterPath(request.url);
            let relativePath = normalizeRouterPath(path.relative(basePath, fileOrDir));

            if (documentJson) {
                // return as JSON?

                if (["/json", "/json/"].includes(relativePath)) {
                    response.writeHead(200, {
                        "Content-Disposition": "attachment; filename=\"api-openapi3.json",
                        "Content-Type": "application/json; charset=UTF-8",
                        "Content-Length": String(documentJson.length)
                    });
                    response.write(documentJson);

                    return;
                }
            }

            if (documentYAML) {
                // return as YAML?

                if (["/yaml", "/yaml/"].includes(relativePath)) {
                    response.writeHead(200, {
                        "Content-Disposition": "attachment; filename=\"api-openapi3.yaml",
                        "Content-Type": "application/x-yaml; charset=UTF-8",
                        "Content-Length": String(documentYAML.length)
                    });
                    response.write(documentYAML);

                    return;
                }
            }

            let fullPath = path.join(pathToSwaggerUi, relativePath);

            if (
                fullPath.startsWith(pathToSwaggerUi + path.sep) ||
                fullPath === pathToSwaggerUi
            ) {
                let existingFile: string | false = false;

                if (fs.existsSync(fullPath)) {
                    const fileOrDirStats = await stat(fullPath);
                    if (fileOrDirStats.isDirectory()) {
                        fullPath = indexHtmlFilePath;

                        if (fs.existsSync(fullPath)) {
                            existingFile = fullPath;
                        }
                    }
                    else {
                        existingFile = fullPath;
                    }
                }

                if (fullPath === swaggerInitializerJSFilePath) { // swagger-initializer.js
                    response.writeHead(200, {
                        "Content-Type": "text/javascript; charset=UTF-8",
                        "Content-Length": String(swaggerInitializerJSContent.length)
                    });
                    response.write(swaggerInitializerJSContent);

                    return;
                }

                if (existingFile) {  // does file exist?
                    const contentType = knownFileMimes[path.extname(existingFile)]
                        || "application/octet-stream";
                    const content = await readFile(existingFile);

                    response.writeHead(200, {
                        "Content-Type": contentType,
                        "Content-Length": String(content.length)
                    });
                    response.write(content);

                    return;
                }
            }

            if (!response.headersSent) {
                response.writeHead(404, {
                    "Content-Length": "0"
                });
            }
        }
        catch (ex) {
            const errorMessage = Buffer.from(String(ex), "utf8");

            if (!response.headersSent) {
                response.writeHead(500, {
                    "Content-Length": String(errorMessage.length),
                    "Content-Type": "text/plain; charset=UTF-8"
                });
            }

            response.write(errorMessage);
        }
    });
}

function updateOperationObject(options: IUpdateOperationObject) {
    const {
        document,
        httpMethod,
        operation,
        rawPath,
        resolveOperation
    } = options;
    if (isNil(operation)) {
        return;
    }

    if (typeof operation !== "object") {
        throw new TypeError("Swagger path operation must be of type object");
    }

    const swaggerPath = toSwaggerPath(rawPath);

    let pathObj = document.paths[swaggerPath];
    if (!pathObj) {
        document.paths[swaggerPath] = pathObj = {};  // initialize
    }

    if (!(pathObj as any)[httpMethod]) {
        // only if not alredy defined
        (pathObj as any)[httpMethod] = operation;

        resolveOperation({
            operation
        });
    }
}
