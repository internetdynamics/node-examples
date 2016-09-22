
var express = require('express');
var port = 8008;

var app = express();

app.use(function (req, res, next) {
    console.log("%s %s://%s%s", req.method, req.protocol, req.headers.host, req.originalUrl);
    next();
});

app.use(express["static"](__dirname+"/public"));

// *************************************************************************

app.use("/api/error1", function (req, res, next) {
    msg = "Error 1 (where a runing error occurs) (variable not declared)";
});

app.use("/api/error2", function (req, res, next) {
    next(new Error("Error2"));
});

app.use("/api/error3", function (req, res, next) {
    throw new Error("Error3 (where an error is thrown)");
});

app.use("/api", function (req, res, next) {
    res.json({
        success: false,
        message: "not yet implemented",
        url: req.url,
        params: req.params,
        query: req.query
    });
});

// *************************************************************************

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

