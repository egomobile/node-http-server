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

import type { IHttpServer, ITestEventHandlerContext, TestEventHandler } from "..";
import { asAsync } from "../utils";

export function setupEventMethods(server: IHttpServer) {
    const testHandlers: TestEventHandler[] = [];

    // emit()
    server.emit = (event: string, ...args: any[]): any => {
        if (event === "test") {
            const context = args[0] as ITestEventHandlerContext;
            if (typeof context !== "object") {
                throw new TypeError("context must be of type object");
            }

            return new Promise<void>(async (resolve, reject) => {
                try {
                    for (const handler of testHandlers) {
                        handler(context);
                    }

                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        else {
            throw new TypeError(`Event ${event} is not supported`);
        }
    };

    // on
    server.on = (event: string, ...args: any[]): any => {
        if (event === "test") {
            const handler = args[0] as TestEventHandler;
            if (typeof handler !== "function") {
                throw new TypeError("handler must be of type function");
            }

            testHandlers.push(asAsync(handler));
        }
        else {
            throw new TypeError(`Event ${event} is not supported`);
        }
    };
}
