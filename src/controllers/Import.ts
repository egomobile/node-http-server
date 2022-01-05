/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */

import { SETUP_IMPORTS } from '../constants';
import { InitControllerImportAction, ObjectKey } from '../types/internal';
import { getListFromObject } from './utils';

/**
 * Imports a value into a property and sets up a getter for this.
 *
 * @example
 * ```
 * import createServer, { Controller, ControllerBase, IHttpRequest, IHttpResponse, Import } from '@egomobile/http-server'
 *
 * // setup controller and define the
 * // value keys to import
 *
 * @Controller()
 * export default class MyController extends ControllerBase {
 *   @Import('foo')  // s. [1]
 *   public fooValue!: string
 *
 *   @Import('currentTime')  // s. [2]
 *   public now!: Date
 *
 *   @GET()
 *   async index(request: IHttpRequest, response: IHttpResponse) {
 *     response.write(this.fooValue + ': ' + this.now)
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
 * @param {ObjectKey} key The key.
 *
 * @returns {MethodDecorator} The new decorator function.
 */
export function Import(key: ObjectKey): PropertyDecorator {
    return function (target, propertyName) {
        getListFromObject<InitControllerImportAction>(target, SETUP_IMPORTS).push(
            ({ controller, imports }) => {
                const lazyValue = (imports as any)[key];

                if (typeof lazyValue === 'undefined') {
                    throw new TypeError('Import value not found');
                }

                // setup the property with a getter
                Object.defineProperty(controller, propertyName, {
                    enumerable: true,
                    configurable: true,
                    get: createGetter(lazyValue)
                });
            }
        );
    };
}

function createGetter(lazyValue: any): () => any {
    if (typeof lazyValue === 'function') {
        return lazyValue;
    }

    return () => lazyValue;
}
