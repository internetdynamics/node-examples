
var express = require('express');

var app = express();

app.use(function (req, res, next) {
    console.log("request: %s params=%j query=%j : %s %s %s", req.path, req.params, req.query, req.protocol, req.hostname, req.url);
    next();
});

app.use(express["static"](__dirname+"/htdocs"));
app.use("/assets", express["static"](__dirname+"/assets"));

app.use("/api", function (req, res, next) {
    res.json({
        success: false,
        message: "not yet implemented",
        params: req.params,
        query: req.query,
        body: req.body
    });
});

var server = app.listen(8000, function() {
    console.log('Listening on port %d', server.address().port);
});

