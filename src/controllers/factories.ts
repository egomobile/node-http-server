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

import fs from 'fs';
import minimatch from 'minimatch';
import path from 'path';
import { INIT_CONTROLLER_METHOD_ACTIONS, IS_CONTROLLER_CLASS } from '../constants';
import type { Constructor, HttpRequestHandler, IControllersOptions, IHttpController, IHttpControllerOptions, IHttpServer, Nilable } from '../types';
import type { InitControllerMethodAction } from '../types/internal';
import { getAllClassProps, isClass, isNil, walkDirSync } from '../utils';
import { normalizeRouterPath } from './utils';

interface IControllerClass {
    class: Constructor<IHttpController>;
    file: IControllerFile;
}

interface IControllerFile {
    fullPath: string;
    relativePath: string;
}

export function setupHttpServerControllerMethod(server: IHttpServer) {
    server.controllers = (...args: any[]) => {
        const isTypeScript = __filename.endsWith('.ts');

        let options: Nilable<IControllersOptions>;

        if (args.length) {
            if (typeof args[0] === 'string') {
                options = {
                    rootDir: args[0]
                };
            } else if (typeof args[0] === 'object') {
                options = args[0];
            } else {
                throw new TypeError('Argument must be of type string or object');
            }
        }

        if (!options) {
            options = {};
        }

        let rootDir: string;
        if (isNil(options.rootDir)) {
            rootDir = path.join(process.cwd(), 'controllers');
        } else {
            if (typeof options.rootDir !== 'string') {
                throw new TypeError('options.rootDir must be of type string');
            }

            if (path.isAbsolute(options.rootDir)) {
                rootDir = options.rootDir;
            } else {
                rootDir = path.join(process.cwd(), options.rootDir);
            }
        }

        if (!fs.existsSync(rootDir)) {
            throw new Error(`Directory ${rootDir} does not exist`);
        }
        if (!fs.statSync(rootDir).isDirectory()) {
            throw new Error(`${rootDir} is no directory`);
        }

        const patterns: string[] = [];
        if (!isNil(options.patterns)) {
            if (Array.isArray(options.patterns)) {
                patterns.push(...options.patterns);
            } else {
                patterns.push(options.patterns);
            }
        }

        if (!patterns.length) {
            patterns.push(isTypeScript ? '*.+(js|ts)' : '*.js');
        }

        if (!patterns.every(p => typeof p === 'string')) {
            throw new TypeError('All elements of options.patterns must be of type string');
        }

        const minimatchOpts: minimatch.IOptions = {
            dot: false,
            matchBase: true
        };

        // collect matching files
        const controllerFiles: IControllerFile[] = [];
        walkDirSync(rootDir, (file) => {
            const relativePath = normalizeRouterPath(
                path.relative(rootDir, file)
            );

            if (!patterns.some(p => minimatch(relativePath, p, minimatchOpts))) {
                return;  // does not match pattern
            }

            controllerFiles.push({
                fullPath: file,
                relativePath
            });
        });

        if (!controllerFiles.length) {
            throw new Error(`No controller files found in ${rootDir}`);
        }

        controllerFiles.sort();

        const controllerClasses: IControllerClass[] = [];

        controllerFiles.forEach(file => {
            const controllerModule = require(file.fullPath);
            const controllerClass: Nilable<IHttpController> = controllerModule.default;

            if (!isNil(controllerClass)) {
                if (isClass<IHttpController>(controllerClass)) {
                    if ((controllerClass.prototype as any)[IS_CONTROLLER_CLASS]) {
                        // only if marked as class

                        controllerClasses.push({
                            class: controllerClass,
                            file
                        });
                    }
                } else {
                    throw new TypeError(`Default export in ${file.fullPath} must be of type class`);
                }
            }
        });

        if (!controllerClasses.length) {
            throw new Error(`No controllers found in ${rootDir}`);
        }

        controllerClasses.forEach(cls => {
            const contollerOptions: IHttpControllerOptions = {
                app: server,
                file: cls.file.fullPath,
                path: cls.file.relativePath
            };

            const controller = new cls['class'](contollerOptions);

            const classProps = getAllClassProps(cls['class']);
            classProps.forEach(prop => {
                if (prop.trimStart().startsWith('_')) {
                    return;  // ignore all props with leading _
                }

                const propValue: unknown = (controller as any)[prop];
                if (typeof propValue === 'function') {
                    if (prop === 'constructor') {
                        return;
                    }

                    const initMethodActions: Nilable<InitControllerMethodAction[]> = (propValue as any)[INIT_CONTROLLER_METHOD_ACTIONS];
                    if (initMethodActions) {
                        initMethodActions.forEach(action => {
                            action({
                                controller,
                                controllerClass: cls['class'],
                                fullFilePath: cls.file.fullPath,
                                method: propValue as HttpRequestHandler,
                                relativeFilePath: cls.file.relativePath,
                                server
                            });
                        });
                    }
                }
            });
        });

        return server;
    };
}
