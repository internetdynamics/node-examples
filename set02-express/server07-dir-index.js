
var express = require('express');
var serveFavicon = require("serve-favicon");    // Serve a favicon
var serveIndex = require("serve-index");        // Serve directory listing for a given path
var fileStreamRotator = require('file-stream-rotator');  // Useful for morgan to create rotated log files
var morgan = require('morgan');                 // Create a typical HTTP log

var port = 8008;
var logdir = "log";

var app = express();

// ---------------------------------------------------------------------------------
// Serve favicons from memory. Exclude from logs.
app.use(serveFavicon(__dirname + '/public/favicon.ico'));

// ---------------------------------------------------------------------------------
// Log every request. (console.log() is not production-ready logging)
app.use(function (req, res, next) {
    console.log("%s %s://%s%s", req.method, req.protocol, req.headers.host, req.originalUrl);
    next();
});

// ---------------------------------------------------------------------------------
// Log every request in Apache format to rotated log files (using "morgan")
var accessLogStream = fileStreamRotator.getStream({
  filename: logdir + '/access-%DATE%.log',
  frequency: 'daily',
  date_format: "YYYYMMDD",
  verbose: false
});

app.use(morgan('combined', {
  stream: accessLogStream
}));

// ---------------------------------------------------------------------------------
// Serve static files (and indexes of directories)
app.use(express["static"](__dirname+"/public"));
app.use('/', serveIndex('public', {'icons': true}))

// ---------------------------------------------------------------------------------
// Handle Errors
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.use(function(req, res, next) {
  res.status(404).send("Not Found");
});

// ---------------------------------------------------------------------------------
// Start the server
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

