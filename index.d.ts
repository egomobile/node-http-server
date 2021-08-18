
declare module 'http' {
    export interface IncomingMessage {
        /**
         * The body, if parsed.
         */
        body?: any;
    }
}
