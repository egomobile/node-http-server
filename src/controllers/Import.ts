/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { SETUP_IMPORTS } from "../constants";
import type { InitControllerImportAction, Nilable, ObjectKey } from "../types/internal";
import { isNil } from "../utils";
import { getListFromObject } from "./utils";

/**
 * Imports a value into a property and sets up a getter for this.
 *
 * @example
 * ```
 * import createServer, { Controller, ControllerBase, GET, IHttpRequest, IHttpResponse, Import } from '@egomobile/http-server'
 *
 * // setup controller and define the
 * // value keys to import
 *
 * @Controller()
 * export default class MyController extends ControllerBase {
 *   @Import()  // s. [1]
 *   public foo!: string
 *
 *   @Import('currentTime')  // s. [2]
 *   public now!: Date
 *
 *   @GET()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write(this.foo + ': ' + this.now)
 *   }
 * }
 *
 * // setup server with import values ...
 *
 * const app = createServer()
 *
 * // setup controller
 * // with import values
 * app.controllers(__dirname, {
 *   // [1] no function => static value for MyController.foo property
 *   foo: 'bar',
 *
 *   // [2] function => dynamic value for MyController.now property
 *   currentTime: () => new Date(),
 * })
 *
 * app.listen()
 * ```
 *
 * @param {Nilable<ObjectKey>} [key] The key. Default: The name of the underlying property.
 *
 * @returns {PropertyDecorator} The new decorator function.
 */
export function Import(key?: Nilable<ObjectKey>): PropertyDecorator {
    if (!isNil(key)) {
        if (typeof key !== "string" && typeof key !== "symbol") {
            throw new TypeError("key must be of type string or symbol");
        }
    }

    return function (target, propertyName) {
        const valueKey = isNil(key) ? propertyName : key!;

        getListFromObject<InitControllerImportAction>(target, SETUP_IMPORTS).push(
            ({ controller, imports }) => {
                const lazyValue = (imports as any)[valueKey];

                if (typeof lazyValue === "undefined") {
                    throw new TypeError(`Import value ${String(valueKey)} not found`);
                }

                // setup the property with a getter
                Object.defineProperty(controller, propertyName, {
                    "enumerable": true,
                    "configurable": true,
                    "get": createGetter(lazyValue)
                });
            }
        );
    };
}

function createGetter(lazyValue: any): () => any {
    if (typeof lazyValue === "function") {
        return lazyValue;
    }
    else {
        return () => {
            return lazyValue;
        };
    }
}
