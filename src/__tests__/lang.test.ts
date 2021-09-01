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
import { lang } from '../middlewares';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';
import { binaryParser, createServer } from './utils';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('Simple request with Accept-Language header', () => {
    ['get', 'delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 with 'de' as result when do a ${methodName} request with a supported language`, async (path) => {
            const expectedResult = 'de';

            const server = createServer();

            (server as any)[method](path, [lang('en', 'de')], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(req.lang);
            });

            const response = await (request(server) as any)[method]('/')
                .set('Accept-Language', 'de, en-GB;q=0.85, en;q=0.9')
                .send()
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str.length).toBe(expectedResult.length);
            expect(str).toBe(expectedResult);
        });

        it.each(routePaths)(`should return 200 with 'en' as default result when do a ${methodName} request with an unsupported language`, async (path) => {
            const expectedResult = 'en';

            const server = createServer();

            (server as any)[method](path, [lang('en', 'de')], async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(req.lang);
            });

            const response = await (request(server) as any)[method]('/')
                .set('Accept-Language', 'ru, en-GB;q=0.85, en;q=0.9')
                .send()
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str.length).toBe(expectedResult.length);
            expect(str).toBe(expectedResult);
        });
    });
});
