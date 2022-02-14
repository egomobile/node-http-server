import type { IExistingAndAuthorizedUser } from './src/types';

declare module 'http' {
    export interface IncomingMessage {
        /**
         * The authorized user.
         */
        authorizedUser?: IExistingAndAuthorizedUser;
        /*
         * List of parameters, if parsed.
         */
        params?: Record<string, string>;
    }
}
