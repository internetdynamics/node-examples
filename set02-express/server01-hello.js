
var express = require('express');
var port = 8008;

var app = express();

app.use(function (req, res, next) {
    console.log("Request: %s", req.url);
    res.contentType('text/plain');
    res.send("Hello world");
});

app.listen(port, function() {
    console.log('Listening on port %d', port);
});

