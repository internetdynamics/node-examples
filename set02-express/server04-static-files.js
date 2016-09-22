
var express = require('express');
var port = 8008;

var app = express();

app.use(function (req, res, next) {
    console.log("%s %s://%s%s", req.method, req.protocol, req.headers.host, req.originalUrl);
    next();
});

app.use(express["static"](__dirname+"/public"));

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

