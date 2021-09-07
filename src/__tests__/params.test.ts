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
import { params } from '../validators';
import { IHttpRequest, IHttpResponse } from '../types';
import { binaryParser, createServer } from './utils';

describe('Simple request with parameters', () => {
    ['get', 'delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it(`should return 200 when do a ${methodName} request with a 'bar' parameter in path`, async () => {
            const expectedResult = 'baz'.toUpperCase().trim();

            const server = createServer();

            (server as any)[method](params('/foo/:bar'), async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(req.params!.bar.toUpperCase().trim());
            });

            const response = await (request(server) as any)[method]('/foo/baz')
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

        it(`should return 200 when do a ${methodName} request with 'foo' and 'bar' parameters in path`, async () => {
            const expectedResult = '2:1';

            const server = createServer();

            (server as any)[method](params('/:foo/:bar'), async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(
                    `${req.params!.foo}:${req.params!.bar}`
                );
            });

            const response = await (request(server) as any)[method]('/2/1')
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

        it(`should return 200 when do a ${methodName} request with 'baz' prefix and 'foo' and 'bar' parameters in path`, async () => {
            const expectedResult = '22:11';

            const server = createServer();

            (server as any)[method](params('/baz/:foo/:bar'), async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(
                    `${req.params!.foo}:${req.params!.bar}`
                );
            });

            const response = await (request(server) as any)[method]('/baz/22/11')
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

        it(`should return 200 when do a ${methodName} request with 'dirs' and 'files' parts, and 'foo' and 'bar' parameters in path`, async () => {
            const expectedResult = '222:111';

            const server = createServer();

            (server as any)[method](params('/dirs/:foo/files/:bar'), async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(
                    `${req.params!.foo}:${req.params!.bar}`
                );
            });

            const response = await (request(server) as any)[method]('/dirs/222/files/111')
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

        it(`should return 200 when do a ${methodName} request with 'dirs' and 'files' parts, and 'foo' parameter in path`, async () => {
            const expectedResult = '33 33@';

            const server = createServer();

            (server as any)[method](params('/dirs/:foo/files'), async (req: IHttpRequest, resp: IHttpResponse) => {
                resp.write(req.params!.foo);
            });

            const response = await (request(server) as any)[method]('/dirs/33%2033%40/files')
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
