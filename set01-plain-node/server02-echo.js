/*
 * https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
 */

var http = require('http');

var port = 8008;

var handleRequest = function (req, res) {
    req.on('error', function(err) {
        console.error(err);
        res.statusCode = 400;
        res.end();
    });
    res.on('error', function(err) {
        console.error(err);
    });
    if (req.method === 'GET' && req.url === '/echo') {
        req.pipe(res);
    }
    else {
        res.statusCode = 404;
        res.write("Not Found");
        res.end();
    }
};
var server = http.createServer(handleRequest);
server.listen(port);

