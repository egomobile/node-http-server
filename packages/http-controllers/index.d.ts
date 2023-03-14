import "@egomobile/http-server";
import type { IControllersOptions, IControllersResult } from "./src/types/index.js";

declare module "http" {
    interface IncomingMessage {
    }
}

declare module "http2" {
}

declare module "@egomobile/http-server" {
    interface IHttpServer {
        /**
         * Initializes the underlying server instance, using controllers.
         *
         * @param {string} [rootDir=controllers] The custom root directory of the controller files. Relative paths will be mapped to the current working directory.
         * @param {IControllersOptions} options Custom options.
         */
        controllers(): Promise<IControllersResult>;
        controllers(rootDir: string): Promise<IControllersResult>;
        controllers(options: IControllersOptions): Promise<IControllersResult>;
    }
}
