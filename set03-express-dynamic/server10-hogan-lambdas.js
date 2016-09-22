
var express = require('express');                        // The Node.js Express application framework
var config = require('./config');                        // Our custom application-specific config file (loaded just like any module with require())
//var serveFavicon = require("serve-favicon");           // Serve a favicon
//var serveIndex = require("serve-index");               // Serve directory listing for a given path
var morgan = require('morgan');                          // Create a typical HTTP log
var fileStreamRotator = require('file-stream-rotator');  // Useful for morgan to create rotated log files
var hoganExpress = require('hogan-express');             // Adapter which makes Hogan templates work for Express
var _ = require('lodash');                               // General Javascript language utilities

var port = 8008;

var app = express();

// ---------------------------------------------------------------------------------
// Configure the Express app from the config.js file
// https://expressjs.com/en/4x/api.html#app.settings.table
var key, value;
if (config.app) {
    // app.settings
    if (config.app.settings) {
        for (key in config.app.settings) {
            app.set(key, config.app.settings[key]);
        }
    }
    // app.locals
    if (config.app.locals) {
        _.defaults(app.locals, config.app.locals);
    }
}
app.set('env', process.env.NODE_ENV || "development");
app.set('views', __dirname + '/views');
app.engine('html', hoganExpress);

// ---------------------------------------------------------------------------------
// Serve favicons from memory. Exclude from logs.
// app.use(serveFavicon(__dirname + '/public/favicon.ico'));

// ---------------------------------------------------------------------------------
// Log every request.
if (app.get("env") === "development") {
    app.use(morgan('dev'));
}
else {
    // Log every request in Apache format to rotated log files (using "morgan")
    var logdir = "log";
    var accessLogStream = fileStreamRotator.getStream({
        filename: logdir + '/access-%DATE%.log',
        frequency: 'daily',
        date_format: "YYYYMMDD",
        verbose: false
    });
    app.use(morgan('combined', {
        stream: accessLogStream
    }));
}

// ---------------------------------------------------------------------------------
// Render views using Hogan template system
// * https://www.npmjs.com/package/hogan-express

var hoganLambdas = require("./lib/hogan-lambdas");
app.set('lambdas', hoganLambdas);

// ---------------------------------------------------------------------------------
// Set up Router for all of the basic named pages
var pagesRouter = require('./routes/pages');
app.use('/', pagesRouter);

// ---------------------------------------------------------------------------------
// Serve static files (and indexes of directories)
app.use(express["static"](__dirname+"/public"));
// app.use('/', serveIndex('public', {'icons': true}))

// ---------------------------------------------------------------------------------
// Handle 404 Errors (which are not application errors)
app.use(function(req, res, next) {
    res.status(404).send("Not Found");
});

// ---------------------------------------------------------------------------------
// Handle Application Errors
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// ---------------------------------------------------------------------------------
// Start the server
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

