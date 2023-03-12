const polka = require("polka");

function mw1(request, response, next) {
    request.mk = "Marcel";
    next();
}

function mw2(request, response, next) {
    request.tm = "Tanja";
    next();
}

const app = polka();

app.use(mw1, mw2);

app.get("/favicon.ico", () => { });
app.get("/", (request, response) => {
    return response.end("Hello, e.GO!");
});
app.get("/user/:id", async (request, response) => {
    response.end(`User: ${request.params.id}`);
});

app.listen(3000);

console.log("polka running ...");
