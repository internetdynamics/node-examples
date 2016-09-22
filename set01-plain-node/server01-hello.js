/*
 * https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
 */

var http = require('http');

var port = 8008;

var handleRequest = function (req, res) {
    res.write("Hello World");
    res.end();
};
var server = http.createServer(handleRequest);

server.listen(port);

