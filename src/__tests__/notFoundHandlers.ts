import { binaryParser, createServer } from './utils';
import request from 'supertest';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('\'not found\' handlers', () => {
    ['delete', 'get', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 404, when do a ${methodName} request with a default 'not found' handler`, async (path) => {
            const server = createServer();

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                response.write('FOO!');
            });

            const response = await (request(server) as any)[method]('/foo')
                .send()
                .parse(binaryParser)
                .expect(404);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });

        it.each(routePaths)(`should return 400, when do a ${methodName} request with a custom 'not found' handler`, async (path) => {
            const server = createServer();

            (server as any)[method](path, async (request: IHttpRequest, response: IHttpResponse) => {
                throw new Error('Something, went wrong!');
            });

            server.setNotFoundHandler(async (request, response) => {
                if (!response.headersSent) {
                    response.writeHead(400);
                }

                response.write(`${request.url} not found`);
                response.end();
            });

            const response = await (request(server) as any)[method]('/foo')
                .send()
                .parse(binaryParser)
                .expect(400);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(43);

            const str: string = data.toString('utf8');
            expect(typeof str).toBe('string');
            expect(str).toBe('/foo not found');
        });
    });
});
