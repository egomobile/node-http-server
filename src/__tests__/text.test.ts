import { binaryParser, createServer } from './utils';
import request from 'supertest';
import { HttpRequestPath, IHttpRequest, IHttpResponse } from '../types';
import { text } from '../middlewares';

const routePaths: HttpRequestPath[] = [
    '/',
    (request) => request.url === '/',
    /^(\/)$/i
];

describe('text() middleware', () => {
    ['delete', 'options', 'patch', 'put', 'post', 'trace'].forEach(method => {
        const methodName = method.toUpperCase();

        it.each(routePaths)(`should return 200 when do a ${methodName} request`, async (path) => {
            const server = createServer();

            (server as any)[method](path, [
                text()
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    Buffer.from((typeof request.body).toUpperCase() + ': ' + request.body, 'utf8')
                );
            });

            const textToSend = `Fatal ist mir das Lumpenpack,
das, um die Herzen zu rühren,
den Patriotismus trägt zur Schau,
mit allen seinen Geschwüren.`;

            const response = await (request(server) as any)[method]('/')
                .send(textToSend)
                .parse(binaryParser)
                .expect(200);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);

            const str = data.toString('utf8');

            expect(str).toEqual('STRING: ' + textToSend);
        });

        it.each(routePaths)(`should return 413 when do a ${methodName} request with data, which is bigger than the limit`, async (path) => {
            const server = createServer();

            const textToSend = `Fest gemauert in der Erden
Steht die Form, aus Lehm gebrannt.         
Heute muss die Glocke werden     
Frisch Gesellen, seid zur Hand.`;

            (server as any)[method](path, [
                text({ limit: textToSend.length - 1 })
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    Buffer.from((typeof request.body) + ': ' + request.body, 'utf8')
                );
            });

            const response = await (request(server) as any)[method]('/')
                .send(textToSend)
                .parse(binaryParser)
                .expect(413);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });

        it.each(routePaths)(`should return 400 when do a ${methodName} request with data, which is bigger than the limit and a custom error handler`, async (path) => {
            const server = createServer();

            const textToSend = 'Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.';

            (server as any)[method](path, [
                text({
                    limit: textToSend.length - 1,
                    onLimitReached: async (request, response) => {
                        if (!response.headersSent) {
                            response.writeHead(400);
                        }

                        response.end();
                    }
                })
            ], async (request: IHttpRequest, response: IHttpResponse) => {
                response.write(
                    Buffer.from((typeof request.body) + ': ' + request.body, 'utf8')
                );
            });

            const response = await (request(server) as any)[method]('/')
                .send(textToSend)
                .parse(binaryParser)
                .expect(400);

            const data = response.body;
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(data.length).toBe(0);
        });
    });
});
