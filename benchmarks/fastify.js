const fastify = require('fastify').default;

function mw1(request, response, next) {
    request.mk = 'Marcel';
    next();
}

function mw2(request, response, next) {
    request.tm = 'Tanja';
    next();
}

const app = fastify();

app.register(require('@fastify/express')).then(async () => {
    app.use(mw1, mw2);

    app.get('/favicon.ico', () => { });
    app.get('/', (request, response) => response.send('Hello, e.GO!'));
    app.get('/user/:id', async (request, response) => {
        response.send(`User: ${request.params.id}`);
    });

    await app.listen({
        port: 3000
    });
});
