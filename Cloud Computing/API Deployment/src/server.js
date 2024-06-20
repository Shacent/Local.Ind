const http = require("http");
const app = require("./app");

const port = 8080;

const server = http.createServer(app);

server.listen(port, () => {
    let baseUrl = `http://localhost:${port}`;

    if (process.env.CLOUD_SHELL_BASE_URL) {
        baseUrl = `${process.env.CLOUD_SHELL_BASE_URL}:${port}`;
    }

    console.log(`listening to ${baseUrl}`);
});
