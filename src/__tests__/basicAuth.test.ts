import request from 'supertest';
import { basicAuth, BasicAuthValidationFailedHandler } from '../middlewares';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';
import { createServer } from './utils';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

const username = 'foo.user';
const password = 'foo.password';

const onValidationFailed: BasicAuthValidationFailedHandler = async (username, request, response) => {
    const errorMessage = Buffer.from(`Unvalid credentials for user ${username}`, 'utf8');

    if (!response.headersSent) {
        response.writeHead(403, {
            'Content-Length': String(errorMessage.length)
        });
    }

    response.write(errorMessage);
};

describe('basicAuth() middleware', () => {
    ['get', 'delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 204 when send a valid username and password via Authorization header on a ${methodName} request`, async (path) => {
            const basicValue = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

            const server = createServer();

            (server as any)[method](path, [
                basicAuth(username, password)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    'Content-Type': '0'
                });
            });

            await (request(server) as any)[method]('/')
                .set('Authorization', 'Basic ' + basicValue)
                .send()
                .expect(204);
        });

        it.each(routePaths)(`should return 401 when send an in-valid username via Authorization header on a ${methodName} request`, async (path) => {
            const basicValue = Buffer.from(`${username + 'Bar'}:${password}`, 'utf8').toString('base64');

            const server = createServer();

            (server as any)[method](path, [
                basicAuth(username, password)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    'Content-Type': '0'
                });
            });

            await (request(server) as any)[method]('/')
                .set('Authorization', 'Basic ' + basicValue)
                .send()
                .expect(401);
        });

        it.each(routePaths)(`should return 403 when send an in-valid username via Authorization header on a ${methodName} request, with custom error handler`, async (path) => {
            const basicValue = Buffer.from(`${username + 'Bar'}:${password}`, 'utf8').toString('base64');

            const server = createServer();

            (server as any)[method](path, [
                basicAuth(username, password, onValidationFailed)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    'Content-Type': '0'
                });
            });

            await (request(server) as any)[method]('/')
                .set('Authorization', 'Basic ' + basicValue)
                .send()
                .expect(403);
        });

        it.each(routePaths)(`should return 401 when send an in-valid password via Authorization header on a ${methodName} request`, async (path) => {
            const basicValue = Buffer.from(`${username}:${password + 'BUZZ'}`, 'utf8').toString('base64');

            const server = createServer();

            (server as any)[method](path, [
                basicAuth(username, password)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    'Content-Type': '0'
                });
            });

            await (request(server) as any)[method]('/')
                .set('Authorization', 'Basic ' + basicValue)
                .send()
                .expect(401);
        });

        it.each(routePaths)(`should return 401 when send an in-valid password via Authorization header on a ${methodName} request, with custom error handler`, async (path) => {
            const basicValue = Buffer.from(`${username}:${password + 'BUZZ'}`, 'utf8').toString('base64');

            const server = createServer();

            (server as any)[method](path, [
                basicAuth(username, password, onValidationFailed)
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.writeHead(204, {
                    'Content-Type': '0'
                });
            });

            await (request(server) as any)[method]('/')
                .set('Authorization', 'Basic ' + basicValue)
                .send()
                .expect(403);
        });
    });
});
