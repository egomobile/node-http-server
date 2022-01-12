/* eslint-disable unicorn/filename-case */

const { createServer, params } = require('@egomobile/http-server');

function mw1(request, response, next) {
    request.mk = 'Marcel';
    next();
}

function mw2(request, response, next) {
    request.tm = 'Tanja';
    next();
}

const app = createServer();

app.use(mw1, mw2);

app.get('/favicon.ico', () => { });
app.get('/', (request, response) => response.end('Hello, e.GO!'));
app.get(params('/user/:id'), async (request, response) => {
    response.end(`User: ${request.params.id}`);
});

app.listen(3000);
