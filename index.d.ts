
declare module "http" {
    interface IncomingMessage {
        /**
         * If available, the key/value pair of parameters.
         */
        params?: Record<string, string>;
    }
}

declare module "http2" {
}
