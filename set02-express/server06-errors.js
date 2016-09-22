
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
    console.log("BEFORE Error1 occurred");
    msg = "Error 1 (where a runtime error occurs) (variable not declared)";
    console.log("AFTER  Error1 occurred");
    res.status(501).send("Runtime Error. Variable msg not defined.");
});

app.use("/api/error2", function (req, res, next) {
    next(new Error("Error2 (where an error is passed to the next() handler)"));
});

app.use("/api/error3", function (req, res, next) {
    throw new Error("Error3 (where an error is thrown and not caught)");
});

app.use("/api/error4", function (req, res, next) {
    next("Error4 (where a string is passed to the next() handler)");
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

// https://expressjs.com/en/guide/error-handling.html
// https://expressjs.com/en/starter/faq.html
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// The 404 Route (ALWAYS Keep this as the last function)
app.use(function(req, res, next) {
  res.status(404).send("Not Found");
});

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

