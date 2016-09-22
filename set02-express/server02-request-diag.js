
var express = require('express');
var bodyParser = require('body-parser');
var util = require('util');
var port = 8008;

var app = express();
app.set('trust proxy',            ['10.0.0.0/24', 'loopback', 'linklocal', 'uniquelocal']); // true behind Amazon load balancers

var logRequestInfo = function (req, res, next) {
    console.log("%s %s://%s%s", req.method, req.protocol, req.headers.host, req.originalUrl);
    next();
};
var handleRequest = function (req, res, next) {
    if (req.path === "/404") {
        res.status(404).send('Not Found');
    }
    else {
        res.contentType('text/html');
        res.write("<!doctype html>\n");
        res.write("<head><title>Request</title></head>\n");
        res.write("<body>\n");

        res.write("<h1>request (req)</h1>\n");
        res.write("<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>\n");
        res.write("<tr><th>req.method</th><td>"            + req.method                  + "</td></tr>\n");
        res.write("<tr><th>req.protocol</th><td>"          + req.protocol                + "</td></tr>\n");
        res.write("<tr><th>req.hostname</th><td>"          + req.hostname                + "</td></tr>\n");
        res.write("<tr><th>req.headers.host<br>(includes port number)</th><td>" + req.headers.host + "</td></tr>\n");
        res.write("<tr><th>req.path</th><td>"              + req.path                    + "</td></tr>\n");
        res.write("<tr><th>req.url</th><td>"               + req.url                     + "</td></tr>\n");
        res.write("<tr><th>req.originalUrl</th><td>"       + req.originalUrl             + "</td></tr>\n");
        res.write("<tr><th>req._parsedUrl.search</th><td>" + req._parsedUrl.search + "</td></tr>\n");
        res.write("<tr><th>req._parsedUrl.query</th><td>"  + req._parsedUrl.query + "</td></tr>\n");
        res.write("<tr><th>req.params</th><td>"            + JSON.stringify(req.params)  + "</td></tr>\n");
        res.write("<tr><th>req.query</th><td>"             + JSON.stringify(req.query)   + "</td></tr>\n");
        res.write("<tr><th>req.headers[\"user-agent\"]</th><td>" + req.headers["user-agent"] + "</td></tr>\n");
        res.write("<tr><th>req.body<br>(shouldn't exist. we haven't parsed the body.)</th><td>" + JSON.stringify(req.body) + "</td></tr>\n");
        res.write("</table>\n");

        res.write("<h1>Cookies (req.cookies) (shouldn't exist. we haven't parsed the cookies.)</h1>\n");
        res.write("<pre>\n");
        res.write(util.inspect(req.cookies,{depth:2}));
        res.write("</pre>\n");

        res.write("<h1>Request Headers (req.headers)</h1>\n");
        res.write("<pre>\n");
        res.write(util.inspect(req.headers,{depth:2}));
        res.write("</pre>\n");

        res.write("<h1>Request (req) (depth:2)</h1>\n");
        res.write("<pre>\n");
        res.write(util.inspect(req,{depth:2}));
        res.write("</pre>\n");

        res.write("</body>\n");
        res.write("</html>\n");
        res.end();
    }
};
app.use(logRequestInfo);
app.use(handleRequest);

var server;
var startupAction = function() {
    console.log('Listening on port %d', server.address().port);
};
server = app.listen(port, startupAction);

