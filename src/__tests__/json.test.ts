import { binaryParser, createServer } from './utils';
import request from 'supertest';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';
import { json } from '../middlewares';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('json() middleware', () => {
    ['delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 when do a ${methodName} request with valid JSON data`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                json()
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    JSON.stringify(request.body)
                );
            });

            const objectToSend = {
                mk: '23979',
                tm: 5979
            };

            const response = await (request(server) as any)[method]('/')
                .send(objectToSend)
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            const obj = JSON.parse(str);

            expect(typeof obj).toBe('object');
            expect(obj).toEqual(objectToSend);
        });

        it.each(routePaths)(`should return 413 when do a ${methodName} request with valid JSON data, with is bigger than the limit`, async (path) => {
            const server = createServer();

            const objectToSend = {
                mk: '23979',
                tm: 5979
            };
            const objectAsString = JSON.stringify(objectToSend);

            (server as any)[method](path, [
                json({ limit: objectAsString.length - 1 })
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    JSON.stringify(request.body)
                );
            });

            const response = await (request(server) as any)[method]('/')
                .send(objectAsString)
                .parse(binaryParser)
                .expect(413);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });

        it.each(routePaths)(`should return 400 when do a ${methodName} request with invalid data`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                json()
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    JSON.stringify(request.body)
                );
            });

            const response = await (request(server) as any)[method]('/')
                .send('{ x: \' }')
                .parse(binaryParser)
                .expect(400);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });
    });
});
