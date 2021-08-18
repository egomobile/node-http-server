import { binaryParser, createServer } from './utils';
import request from 'supertest';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';
import { buffer } from '../middlewares';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('buffer() middleware', () => {
    ['delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should receive the body as buffer and return 200 when do a ${methodName} request`, async (path) => {
            const expectedResponse = 'Cis0JoUF4SeqXDsItYu2KzJY62h6DC87KfQFQKFzQ7z0s008hyIX7wh9jDbyu9hd';

            const server = createServer();

            (server as any)[method](path, [
                buffer()
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(Buffer.isBuffer(request.body) ? expectedResponse : '');
            });

            const response = await (request(server) as any)[method]('/')
                .send({ mk: 23979, tm: '5979' })
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(typeof str).toBe('string');
            expect(str).toBe(expectedResponse);
        });
    });
});
