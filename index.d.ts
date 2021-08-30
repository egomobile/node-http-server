
declare module 'http' {
    export interface IncomingMessage {
        /*
         * List of parameters, if parsed.
         */
        params?: Record<string, string>;
    }
}
