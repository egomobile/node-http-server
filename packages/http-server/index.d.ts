import type { URLSearchParams } from "node:url";

declare module "http" {
    interface IncomingMessage {
        /**
         * If available, the key/value pair of parameters.
         */
        params?: Record<string, string>;

        /**
         * The query parameters.
         */
        query?: URLSearchParams;
    }
}

declare module "http2" {
}
