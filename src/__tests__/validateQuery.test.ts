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

import request from 'supertest';
import { URLSearchParams } from 'url';
import { schema } from '..';
import { query, validateQuery } from '../middlewares';
import { IHttpRequest, IHttpResponse, ValidationFailedHandler } from '../types';
import { binaryParser, createServer } from './utils';

interface IMyQuerySchema {
    offset: string;
    limit?: string;
}

const myQuerySchema = schema.object({
    offset: schema.string().strict().regex(/^([0-9]){1,}$/).required(),
    limit: schema.string().strict().regex(/^([0-9]){1,}$/).optional()
});

const validData: IMyQuerySchema[] = [{
    offset: '0'
}, {
    offset: '0',
    limit: '10'
}];

const invalidData: any[] = [
    {},
    {
        foo: '0'
    },
    {
        limit: ''
    },
    {
        limit: '',
        offset: '0'
    },
    {
        bar: '10',
        offset: '0'
    }
];

function toQueryString(obj: any): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
        params.set(key, String(value));
    }

    return params.toString();
}

describe('validateQuery() middleware', () => {
    ['get', 'delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(validData)(`should return 200 when do a ${methodName} request and send valid query params`, async (vd) => {
            const server = createServer();
            const resultText = 'ok';

            (server as any)[method]('/', [query(), validateQuery(myQuerySchema)], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write('ok');
            });

            const response = await (request(server) as any)[method]('/?' + toQueryString(vd))
                .send(JSON.stringify(vd))
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str.length).toBe(resultText.length);
            expect(str).toBe(resultText);
        });

        it.each(invalidData)(`should return 400 when do a ${methodName} request and send invalid query params`, async (ivd) => {
            const server = createServer();

            (server as any)[method]('/', [query(), validateQuery(myQuerySchema)], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write('ok');
            });

            await (request(server) as any)[method]('/?' + toQueryString(ivd))
                .send(JSON.stringify(ivd))
                .parse(binaryParser)
                .expect(400);
        });

        it.each(invalidData)(`should return 403 when do a ${methodName} request and send invalid query params and a custom handler`, async (ivd) => {
            const server = createServer();

            const onValidationError: ValidationFailedHandler = async (err, req, resp) => {
                const errorMessage = Buffer.from(
                    err.message,
                    'utf8'
                );

                if (!resp.headersSent) {
                    resp.writeHead(403, {
                        'Content-Length': String(errorMessage.length)
                    });
                }

                resp.write(errorMessage);
                resp.end();
            };

            (server as any)[method]('/', [query(), validateQuery(myQuerySchema, onValidationError)], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write('ok');
            });

            const response = await (request(server) as any)[method]('/?' + toQueryString(ivd))
                .send(JSON.stringify(ivd))
                .parse(binaryParser)
                .expect(403);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str.length > 0).toBe(true);
        });
    });
});
