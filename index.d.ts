
declare module 'http' {
    export interface IncomingMessage {
        /**
         * The body, if parsed.
         */
        body?: any;
        /**
         * List of parameters.
         */
        params?: Record<string, string>;
    }
}
