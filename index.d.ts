import { ParsedUrlQuery } from 'querystring';

declare module 'http' {
    export interface IncomingMessage {
        /**
         * The body, if parsed.
         */
        body?: any;
        /**
         * List of parameters, if parsed.
         */
        params?: Record<string, string>;
        /**
         * List of query parameters, if parsed.
         */
        query?: ParsedUrlQuery;
    }
}
