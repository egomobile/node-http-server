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

import path from 'path';
import request from 'supertest';
import { binaryParser, createServer } from './utils';

function createServerAndInitControllers() {
    const server = createServer();

    server.controllers(path.join(__dirname, 'controllers'));

    return server;
}

describe('controllers', () => {
    it.each(['/', '/bar', '/foo'])('should return 200 when do a GET request for existing IndexController', async (p) => {
        const expectedResult = 'bar:' + p;

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
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

    it.each(['/test/foo%20baz', '/test/foo%20baz/bar'])('should return 200 when do a GET request for existing TestController which uses parameters', async (p) => {
        const expectedResult = 'test:' + p + ':foo baz';

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
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

    it.each(['/baz', '/baz/bar', '/baz/foo'])('should return 200 when do a GET request for existing BazController which uses middlewares', async (p) => {
        const expectedResult = 'baz:' + p + ':21';

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
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
