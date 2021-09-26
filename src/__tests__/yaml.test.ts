import jsYaml from 'js-yaml';
import request from 'supertest';
import { binaryParser, createServer } from './utils';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';
import { yaml } from '../middlewares';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('yaml() middleware', () => {
    ['delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 when do a ${methodName} request with valid YAML data`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                yaml()
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    JSON.stringify(request.body[0])
                );
            });

            const objectToSend = {
                mk: '23979',
                tm: 5979
            };
            const objectAsString = jsYaml.dump(objectToSend);

            const response = await (request(server) as any)[method]('/')
                .send(objectAsString)
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            const obj = JSON.parse(str);

            expect(typeof obj).toBe('object');
            expect(obj).toEqual(objectToSend);
        });

        it.each(routePaths)(`should return 413 when do a ${methodName} request with valid YAML data, with is bigger than the limit`, async (path) => {
            const server = createServer();

            const objectToSend = {
                mk: '23979',
                tm: 5979
            };
            const objectAsString = jsYaml.dump(objectToSend);

            (server as any)[method](path, [
                yaml({ limit: objectAsString.length - 1 })
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    jsYaml.dump(request.body)
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

        it.each(routePaths)(`should return 400 when do a ${methodName} request with invalid data and a default 'parse error' handler`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                yaml()
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    jsYaml.dump(request.body)
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

        it.each(routePaths)(`should return 402 when do a ${methodName} request with invalid data and a custom 'parse error' handler`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                yaml({
                    onParsingFailed: async (error, request, response) => {
                        const errorMessage = Buffer.from('PARSE ERROR: ' + String(error.innerError));

                        if (!response.headersSent) {
                            response.writeHead(402);
                        }

                        response.write(errorMessage);
                        response.end();
                    }
                })
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    jsYaml.dump(request.body)
                );
            });

            const response = await (request(server) as any)[method]('/')
                .send('{ x: \' }')
                .parse(binaryParser)
                .expect(402);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str: string = data.toString('utf8');
            expect(typeof str).toBe('string');
            expect(str).toBe(`PARSE ERROR: YAMLException: unexpected end of the stream within a single quoted scalar (2:1)

 1 | { x: ' }
 2 | 
-----^`);
        });
    });
});
