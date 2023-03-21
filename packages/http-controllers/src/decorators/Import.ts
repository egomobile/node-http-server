/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { ControllerBase } from "..";
import { INIT_IMPORTS_ACTIONS } from "../constants/internal";
import type { InitImportAction } from "../factories/decorators";
import type { ClassFieldDecorator5, Nilable, ObjectKey } from "../types/internal.js";
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
 * @returns {ClassFieldDecorator5} The new decorator function.
 */
export function Import(key?: Nilable<ObjectKey>): ClassFieldDecorator5 {
    if (!isNil(key)) {
        if (!["number", "string", "symbol"].includes(typeof key)) {
            throw new TypeError("key must be of type string, number or symbol");
        }
    }

    return function (target: any, context: ClassFieldDecoratorContext) {
        context.addInitializer(function () {
            const controller = this as ControllerBase;
            const valueKey = isNil(key) ? String(context.name) : key!;

            getListFromObject<InitImportAction>(controller, INIT_IMPORTS_ACTIONS).push(
                async ({ controller, imports }) => {
                    const lazyValue = (imports as any)[valueKey];

                    if (typeof lazyValue === "undefined") {
                        throw new TypeError(`Import value ${String(valueKey)} not found`);
                    }

                    // setup the property with a getter
                    Object.defineProperty(controller, context.name, {
                        "enumerable": true,
                        "configurable": true,
                        "get": createGetter(lazyValue)
                    });
                }
            );
        });
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
