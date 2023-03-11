
declare module "http" {
    export interface IncomingMessage {
        /**
         * If available, the key/value pair of parameters.
         */
        params?: Record<string, string>;
    }
}

declare module "http2" {
}
