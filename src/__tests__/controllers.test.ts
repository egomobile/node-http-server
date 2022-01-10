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

/*
interface IMySchema {
    email: string;
    name?: string;
}
*/

function createServerAndInitControllers() {
    const server = createServer();

    server.controllers(path.join(__dirname, 'controllers'), {
        foo: () => 'bar',
        baz: 42
    });

    return server;
}

/*
const validInputData: IMySchema[] = [{
    email: 'marcel.kloubert@e-go-mobile.com'
}, {
    email: 'marcel.kloubert@e-go-mobile.com',
    name: 'Marcel Kloubert'
}];
*/

const invalidInputData: any[] = [{}];

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

    it.each(['/test_path_params/foo%20baz', '/test_path_params/foo%20baz/bar'])('should return 200 when do a GET request for existing TestController which uses parameters', async (p) => {
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

    it.each(['/test_path_params_via_dirs/foo%20baz', '/test_path_params_via_dirs/foo%20baz/bar'])('should return 200 when do a GET request for existing TestController which uses parameters via directories', async (p) => {
        const expectedResult = 'test2:' + p + ':foo baz';

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

    it.each(['/test_error_handler'])('should return 400 when do a GET request for existing Test3Controller with custom error handler', async (p) => {
        const expectedResult = 'ERROR: ' + p + ' Something went wrong!';

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .parse(binaryParser)
            .expect(400);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString('utf8');

        expect(typeof str).toBe('string');
        expect(str.length).toBe(expectedResult.length);
        expect(str).toBe(expectedResult);
    });

    it.each(['/test_serializer'])('should return 200 when do a GET request for existing Test4Controller with custom serializer', async (p) => {
        const expectedObject = {
            success: true,
            data: 'foo'
        };

        const server = createServerAndInitControllers();

        const response = await request(server).get(p)
            .send()
            .expect(200);

        const data = response.body;
        expect(typeof data).toBe('object');

        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');

        expect(data).toMatchObject(expectedObject);
    });

    /* TODO: reactive => does currently run not in test case
    it.each(validInputData)('should return 200 when do a POST request on /test_schema_validation route for existing Test5Controller with valid input data', async (data) => {
        const server = createServerAndInitControllers();

        await request(server).post('/test_schema_validation')
            .send(
                Buffer.from(JSON.stringify(data), 'utf8')
            )
            .expect(200);
    });
    */

    it.each(invalidInputData)('should return 400 when do a POST request on /test_schema_validation route for existing Test5Controller with invalid input data', async (data) => {
        const server = createServerAndInitControllers();

        await request(server).post('/test_schema_validation')
            .send(data)
            .expect(400);
    });

    it.each(invalidInputData)('should return 409 when do a POST request on /test_schema_validation route for existing Test5Controller with invalid input data', async (data) => {
        const server = createServerAndInitControllers();

        await request(server).post('/test_schema_validation/foo')
            .send(data)
            .expect(409);
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

    it.each([{
        path: 'foo1',
        expectedValue: 'foo1 === 11'
    }, {
        path: 'foo2',
        expectedValue: 'foo2 === 3'
    }])('should return 200 when do a GET request for existing Test6Controller with global middlewares', async (item) => {
        const server = createServerAndInitControllers();

        const response = await request(server).get('/test_middlewares/' + item.path)
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString('utf8');

        expect(typeof str).toBe('string');
        expect(str.length).toBe(item.expectedValue.length);
        expect(str).toBe(item.expectedValue);
    });

    it('should return 200 when do a GET request for existing Test7Controller with import values', async () => {
        const expectedValue = 'FOO:(bar string) BAZ:(42 number)';

        const server = createServerAndInitControllers();

        const response = await request(server).get('/test_imports')
            .send()
            .parse(binaryParser)
            .expect(200);

        const data = response.body;
        expect(Buffer.isBuffer(data)).toBe(true);

        const str = data.toString('utf8');

        expect(typeof str).toBe('string');
        expect(str.length).toBe(expectedValue.length);
        expect(str).toBe(expectedValue);
    });
});
