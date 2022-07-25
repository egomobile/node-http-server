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
import type { IControllersSwaggerOptions, IHttpServer } from "../types";
import swaggerInitializerJs from "./resources/swagger-initializer_js";
import { createSwaggerPathValidator, getSwaggerDocsBasePath } from "./utils";

export interface ISetupSwaggerUIForServerControllersOptions {
    document: OpenAPIV3.Document;
    options: IControllersSwaggerOptions;
    server: IHttpServer;
}

const pathToSwaggerUi: string = require("swagger-ui-dist").absolutePath();

const indexHtmlFilePath = path.join(pathToSwaggerUi, "index.html");
const swaggerInitializerJSFilePath = path.join(pathToSwaggerUi, "swagger-initializer.js");

const { readFile, stat } = fs.promises;

export function setupSwaggerUIForServerControllers({
    document,
    server,
    options
}: ISetupSwaggerUIForServerControllersOptions) {
    const basePath = getSwaggerDocsBasePath(options.basePath);
    const basePathWithSuffix = basePath + (basePath.endsWith("/") ? "" : "/");

    const documentJson = Buffer.from(JSON.stringify(document), "utf8");
    const documentYAML = Buffer.from(yaml.dump(document), "utf8");

    document = JSON.parse(
        documentJson.toString("utf8")
    );

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

            // return as JSON
            if (["/json", "/json/"].includes(relativePath)) {
                response.writeHead(200, {
                    "Content-Disposition": "attachment; filename=\"api-openapi3.json",
                    "Content-Type": "application/json; charset=UTF-8",
                    "Content-Length": String(documentJson.length)
                });
                response.write(documentJson);

                return;
            }

            // return as YAML
            if (["/yaml", "/yaml/"].includes(relativePath)) {
                response.writeHead(200, {
                    "Content-Disposition": "attachment; filename=\"api-openapi3.yaml",
                    "Content-Type": "application/x-yaml; charset=UTF-8",
                    "Content-Length": String(documentYAML.length)
                });
                response.write(documentYAML);

                return;
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
