// This file is part of the @egomobile/http-server distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-server is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-server is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import type { HttpMiddleware } from '../types';
import type { Nilable } from '../types/internal';

interface ICreateMiddlewareOptions {
    additionalLanguages: string[];
    defaultLanguage: string;
}

/**
 * Creates a middleware, that tries to get the current language from
 * 'Accept-Language' HTTP header and writes it to 'lang' property
 * of request context.
 *
 * @param {string} defaultLanguage The default language.
 * @param {string[]} additionalLanguages The list of additional, supported languages.
 *
 * @returns {HttpMiddleware} The new middleware.
 *
 * @example
 * ```
 * import assert from 'assert'
 * import createServer, { IHttpRequest, IHttpResponse, lang } from '@egomobile/http-server'
 *
 * const app = createServer()
 *
 * // try submit 'Accept-Language' HTTP header
 * // with 'de, en-GB;q=0.85, en;q=0.9'
 * app.get('/', [lang('de', 'en')], async (request, response) => {
 *   assert.strictEqual(request.lang, 'de')
 * })
 * ```
 */
export function lang(defaultLanguage: string, ...additionalLanguages: string[]): HttpMiddleware {
    if (typeof defaultLanguage !== 'string') {
        throw new TypeError('defaultLanguage must be of type string');
    }

    if (!Array.isArray(additionalLanguages)) {
        throw new TypeError('additionalLanguages must be of type Array');
    }

    if (!additionalLanguages.every(sl => typeof sl === 'string')) {
        throw new TypeError('All items of additionalLanguages must be of type string');
    }

    return createMiddleware({
        additionalLanguages: additionalLanguages.map(asl => asl.toLowerCase().trim()),
        defaultLanguage: defaultLanguage.toLowerCase().trim()
    });
}

function createMiddleware({ additionalLanguages, defaultLanguage }: ICreateMiddlewareOptions): HttpMiddleware {
    return async (request, response, next) => {
        let lang: Nilable<string>;

        try {
            if (typeof request.headers['accept-language'] === 'string') {
                // parse 'Accept-Language' header
                // example: Accept-Language: de, en-GB;q=0.85, en;q=0.9
                const acceptLanguage = request.headers['accept-language']
                    .split(',')
                    .map(x => {
                        let lang: string;
                        let weight = 1;

                        const sep = x.indexOf(';');
                        if (sep > -1) {
                            lang = x.substring(0, sep);

                            const weightExpr = x.substring(sep + 1);
                            const q = weightExpr.indexOf('q=');
                            if (q > -1) {
                                weight = parseFloat(weightExpr.substring(q + 2).trim());
                            }
                        } else {
                            lang = x;
                        }

                        return {
                            lang: lang.toLowerCase().trim(),
                            weight
                        };
                    });

                lang = acceptLanguage
                    .sort((a, b) => b.weight - a.weight)  // DESC
                    .find(al => additionalLanguages.includes(al.lang))?.lang;
            }
        } catch { }

        request.lang = lang?.length ? lang : defaultLanguage;

        next();
    };
}
