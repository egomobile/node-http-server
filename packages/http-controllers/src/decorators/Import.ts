/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { INIT_IMPORTS_ACTIONS } from "../constants/internal";
import type { InitImportAction } from "../factories/decorators";
import type { Nilable, ObjectKey } from "../types/internal.js";
import { getListFromObject, isNil } from "../utils/internal.js";

/**
 * Imports a value into a property and sets up a getter for this.
 *
 * @example
 * ```
 * import createServer, { IHttp1Request, IHttp1Response } from '@egomobile/http-server'
 * import { Controller, ControllerBase, GET, Import } from '@egomobile/http-controllers'
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
 *   async index(request: IHttp1Request, response: IHttp1Response) {
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
        if (!["number", "string", "symbol"].includes(typeof key)) {
            throw new TypeError("key must be of type string, number or symbol");
        }
    }

    return function (target, propertyName) {
        const valueKey = isNil(key) ? propertyName : key!;

        getListFromObject<InitImportAction>(target, INIT_IMPORTS_ACTIONS).push(
            async ({ controller, imports }) => {
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
