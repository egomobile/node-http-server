import { binaryParser, createServer } from './utils';
import request, { Response as TestResponse } from 'supertest';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';
import { prettyErrors } from '../errors';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('error handlers with pretty output', () => {
    ['delete', 'get', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 500 with a HTML page, when do a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                throw new Error('Something, went wrong!');
            });

            server.setErrorHandler(prettyErrors());

            const response: TestResponse = await (request(server) as any)[method]('/')
                .send()
                .parse(binaryParser)
                .expect(500);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length > 0).toBe(true);

            expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
        });

        it.each(routePaths)(`should return 400 with a HTML page, when do a ${methodName} request and a custom status code`, async (path) => {
            const server = createServer();

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                throw new Error('Something, went wrong!');
            });

            server.setErrorHandler(prettyErrors(400));

            const response: TestResponse = await (request(server) as any)[method]('/')
                .send()
                .parse(binaryParser)
                .expect(400);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length > 0).toBe(true);

            expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
        });

        it.each(routePaths)(`should return 403 with a HTML page, when do a ${methodName} request and a custom status code provider`, async (path) => {
            const server = createServer();

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                throw new Error('Something, went wrong!');
            });

            server.setErrorHandler(prettyErrors(() => 403));

            const response: TestResponse = await (request(server) as any)[method]('/')
                .send()
                .parse(binaryParser)
                .expect(403);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length > 0).toBe(true);

            expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
        });
    });
});
