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
import { HttpRequestPath, IHttpRequest, IHttpResponse, NextFunction } from '../types';
import { binaryParser, createServer } from './utils';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('Middlewares', () => {
    ['delete', 'get', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 and sum from route middlewares as text when do a ${methodName}`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo = '';
                    next();
                },
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo += 'MK';
                    next();
                },
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo += 'TM';
                    next();
                }
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(200);

                response.write((request as any).foo);
            });

            const expectedResponse = 'MKTM';

            const response = await (request(server) as any)[method]('/')
                .send()
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str.length).toBe(expectedResponse.length);
            expect(str).toBe(expectedResponse);
        });

        it.each(routePaths)(`should return 200 and sum from global middlewares and route as text when do a ${methodName}`, async (path) => {
            const server = createServer();

            server.use(
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo = '';
                    next();
                },
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo += 'MK';
                    next();
                },
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo += 'TM';
                    next();
                }
            );

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(200);

                response.write((request as any).foo);
            });

            const expectedResponse = 'MKTM';

            const response = await (request(server) as any)[method]('/')
                .send()
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str.length).toBe(expectedResponse.length);
            expect(str).toBe(expectedResponse);
        });

        it.each(routePaths)(`should return 200 and sum from global and route middlewares and route as text when do a ${methodName}`, async (path) => {
            const server = createServer();

            server.use(
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo = '';
                    next();
                },
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo += 'TM';
                    next();
                },
            );

            (server as any)[method](path, [
                async (request: IHttpRequest, response: IHttpResponse, next: NextFunction) => {
                    (request as any).foo += 'MK';
                    next();
                }
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(200);

                response.write((request as any).foo);
            });

            const expectedResponse = 'TMMK';

            const response = await (request(server) as any)[method]('/')
                .send()
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str.length).toBe(expectedResponse.length);
            expect(str).toBe(expectedResponse);
        });
    });
});
