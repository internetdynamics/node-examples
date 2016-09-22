
var express = require('express');
var util = require('util');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var port = 8008;

var app = express();
app.set('trust proxy',            ['10.0.0.0/24', 'loopback', 'linklocal', 'uniquelocal']); // true behind Amazon load balancers

// Node/Express doesn't parse the body of the request automatically because there are
// a lot of ways to do it depending on what your application is expecting.
// If you want to do it generally, you can set up the handlers for all of the
// parsing methods you need, and they will parse the body if and when the correct
// Content-Type is encountered.
// If you don't need these handlers, you might not want to set them because they add a bit of overhead.
// Each of these functions returns a function which is the "middleware" handler that gets applied to the Express app.
// Each of these has a 100K limit on the size of the body that can be posted. (overridable as an option)
// Each makes the body content available as req.body.
// If you want to parse multipart bodies, you need to use a more advanced parser like "formidable".
app.use(bodyParser.json({ type: "application/json" }));  // parses JSON body of POST'ed API's        (Content-Type: application/json)
app.use(bodyParser.urlencoded({ extended: false }));     // parses parameters of POST'ed forms       (Content-Type: application/x-www-form-urlencoded)
app.use(bodyParser.text());                              // reads text body that is POST'ed to a url (Content-Type: text/plain)

// Node/Express doesn't parse the body of cookies automatically because there are
// a lot of ways to do it depending on what your application is expecting.
// This function returns a function which is the "middleware" handler that gets applied to the Express app.
// It makes cookies available as req.cookies[cookie_name].
app.use(cookieParser());

app.use(function (req, res, next) {
    console.log("%s %s://%s%s", req.method, req.protocol, req.headers.host, req.originalUrl);
    next();
});

app.use(function (req, res, next) {
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
        res.write("<tr><th>req.baseUrl</th><td>"           + req.baseUrl                 + "</td></tr>\n");
        res.write("<tr><th>req.route</th><td>"             + req.route                      + "</td></tr>\n");
        res.write("<tr><th>req.secure</th><td>"            + req.secure                      + "</td></tr>\n");
        res.write("<tr><th>req.ip</th><td>"                + req.ip                      + "</td></tr>\n");
        res.write("<tr><th>req.ips</th><td>"               + JSON.stringify(req.ips)     + "</td></tr>\n");
        res.write("<tr><th>req.subdomains</th><td>"        + JSON.stringify(req.subdomains) + "</td></tr>\n");
        res.write("<tr><th>req.body</th><td>"              + JSON.stringify(req.body)    + "</td></tr>\n");
        res.write("</table>\n");

        res.write("<h1>Cookies (req.cookies)</h1>\n");
        res.write("<pre>\n");
        res.write(util.inspect(req.cookies,{depth:2}));
        res.write("</pre>\n");

        res.write("<h1>Request Headers (req.headers)</h1>\n");
        res.write("<pre>\n");
        res.write(util.inspect(req.headers,{depth:2}));
        res.write("</pre>\n");

        res.write("<h1>Express App (req.app) (depth:2)</h1>\n");
        res.write("<pre>\n");
        res.write(util.inspect(req.app,{depth:2}));
        res.write("</pre>\n");

        res.write("<h1>Request (req) (depth:2)</h1>\n");
        res.write("<pre>\n");
        res.write(util.inspect(req,{depth:2}));
        res.write("</pre>\n");

        res.write("</body>\n");
        res.write("</html>\n");
        res.end();
    }
});

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

