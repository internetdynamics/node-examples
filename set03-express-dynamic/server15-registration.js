
var express = require('express');                           // The Node.js Express application framework
var config = require('./config');                           // Our custom application-specific config file (loaded just like any module with require())
var _ = require('lodash');                                  // General Javascript language utilities
//var serveFavicon = require("serve-favicon");              // Serve a favicon
//var serveIndex = require("serve-index");                  // Serve directory listing for a given path
var morgan = require('morgan');                             // Create a typical HTTP log
var fileStreamRotator = require('file-stream-rotator');     // Useful for morgan to create rotated log files
var connectFlash = require("connect-flash");                // Necessary for flash variables/messages (persist in the session only for the next request)
var cookieParser = require("cookie-parser");                // Necessary for "express-session"
var bodyParser = require("body-parser");                    // Necessary to process POST-ed forms such as the /login form
var expressSession = require('express-session');            // Most commonly used form of durable session support (stored in a database)
var MongoStore = require('connect-mongo/es5')(expressSession);  // the adapter to save "express-session" sessions to MongoDB
var mongoose = require('mongoose');                         // mongoose is the standard database layer
var bluebird = require('bluebird');                         // bluebird is a promise library, suitable for use by mongoose

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

// ---------------------------------------------------------------------------------
// Set up the Hogan template rendering engine
// Set up the Hogan lambdas (custom functions that can be used in rendering templates)
// * https://www.npmjs.com/package/hogan-express

var hoganExpress = require('./lib/hogan-express');          // Adapter which makes Hogan templates work for Express
app.engine('html', hoganExpress);
app.set('views', __dirname + '/views');

var hoganLambdas = require("./lib/hogan-lambdas");
app.set('lambdas', hoganLambdas);

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
// Serve static files (and indexes of directories)
// We do this early so that no session management is required to serve static files.
app.use(express["static"](__dirname+"/public"));
// Serve indexes of directories
// app.use('/', serveIndex('public', {'icons': true}))

// ---------------------------------------------------------------------------------
// Handle flash messages
app.use(connectFlash());             // enables flash variables/messages (persist in the session only for the next request) (used for login error msgs)

// ---------------------------------------------------------------------------------
// Parse Input
app.use(cookieParser());                               // Necessary for "express-session"
app.use(bodyParser.urlencoded({ extended: false }));   // Necessary to process POST-ed forms such as the /login form

// ---------------------------------------------------------------------------------
// Set Up Mongoose
mongoose.Promise = bluebird;                           // set up the promise library Mongoose will use
mongoose.connect(config.mongoose.db.connect);          // connect to the database

// ---------------------------------------------------------------------------------
// Set Up Sessions
var expressSessionConfig = _.clone(config.express_session.config);
expressSessionConfig.store = new MongoStore({
    mongooseConnection: mongoose.connection,
    autoRemove: "disabled",
    collection: "session",   // it will use the "session" table/collection, not "sessions"
    stringify: false
});
app.use(expressSession(expressSessionConfig));

// ---------------------------------------------------------------------------------
// Set up the app for all Passport/authentication-related routes
// (sessions must be set up, as above, before Passport can be configured)
var authUtils = require("./lib/auth-utils");     // custom Passport work
authUtils.configure(app);

// ---------------------------------------------------------------------------------
// Set up routes for all of the basic named pages
var pageUtils = require("./lib/page-utils");
pageUtils.configure(app);

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

