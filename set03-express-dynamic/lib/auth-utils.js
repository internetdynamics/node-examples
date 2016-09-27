
var debug = require('debug')('auth-utils');
var config = require('../config');
var _ = require("lodash");
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mailUtils = require('./mail-utils');
var httpUtils = require('./http-utils');

// Passport
// node_modules/passport/lib/index.js
// node_modules/passport/lib/authenticator.js
//     node_modules/passport/lib/strategies/session.js
//     node_modules/passport/lib/framework/connect.js
//         node_modules/passport/lib/http/request.js
//         node_modules/passport/lib/middleware/initialize.js
//         node_modules/passport/lib/middleware/authenticate.js
//             node_modules/passport/lib/errors/authenticationerror.js
// 
// node_modules/passport/node_modules/passport-strategy/lib/index.js
//     node_modules/passport/node_modules/passport-strategy/lib/strategy.js
// 
// node_modules/passport-local/lib/index.js
//     node_modules/passport-local/lib/strategy.js
//         node_modules/passport-local/lib/utils.js

var passport = require("passport");                      // the main Passport authentication framework
    // requiring "passport" causes the following things to happen.
    // (1)  imports a Passport/Authenticator class  [passport/lib/authenticator.js]
    // (2)  instantiates it (thus instantiating the framework), [passport/lib/authenticator.js:29]
    // (2b) This causes the "http.IncomingMessage" class to be enhanced so that the "req" variable always has the following additional methods attached.
    //      * req.login(user, [options,] [callback])    -- sets req.user = user                                           [logIn() is alias]
    //                                                  -- calls serializeUser(user, req, function (err, sessionUser) { ... })
    //                                                  -- sets req.session.passport.user = sessionUser
    //      * req.logout()                              -- delete req.user  (no req.user === not logged in)              [logOut() is alias]
    //      * req.isAuthenticated()                     -- return(req.user ? true : false);
    //      * req.isUnauthenticated()                   -- return(req.user ? false : true);
    // (3)  create a SessionStrategy class and register it as though with passport.use()
    // (4)  returns a Passport/Authenticator object with the initialize() and authenticate() functions defined.

var LocalStrategy = require('passport-local').Strategy;  // the function that handles username/password authentication (called the "local" auth strategy)
    // This returns a Strategy class. It only has the authenticate() method defined at first. Other methods are added later.
    //      * new LocalStrategy([options,] verify) : verify (callback) = function ([req,] username, password, verified). verified = function (err, user, info)
    //      * LocalStrategy.authenticate(req, options)  -- called from ???
    //      * verified(err, user, info)         -- defined as a local function. gets passed as the callback to the user-defined verify() function.
    //      * strategy.pass()                   -- called from various places to invoke next().     (defined in passport/lib/middleware/authenticate.js)
    //      * strategy.error(err)               -- called from verified(err, user, info) if (err)   (defined in passport/lib/middleware/authenticate.js)
    //      * strategy.fail(info)               -- called from verified(err, user, info) if (!user) (defined in passport/lib/middleware/authenticate.js)
    //      * strategy.success(user, info)      -- called from verified(err, user, info) if (user)  (defined in passport/lib/middleware/authenticate.js)
    //            req.user = user

var User = require('../models/User');                    // the Database Object (a "model") that represents the user table in the database

// Following instructions for Passport as closely as possible.
// http://passportjs.org/docs
var authUtils = {
    // this assumes that sessions have already been configured on Express
    configure: function (app) {
        // console.log("Configuring Passport for Express...");
        debug("Configuring Passport for Express...");

        app.use(passport.initialize());
        // initialize() is a method of the Authenticator/Passport object returned by require("passport")
        // When initialize() is called, it returns a middleware function suitable for passing to app.use().
        // This middleware puts passport on each request in three basic steps.
        //  1. req._passport = {};                           -- create an area on the req(uest) for passport stuff
        //  2. req._passport.instance = passport;            -- save the passport instance (Authenticator/Passport)
        //  3. req._passport.session = req.session.passport; -- create a link from the passport area of the session over to the private req._passport area

        // ***************************************************************************************
        // Interconnecting the Session with the Logged-In User
        // ***************************************************************************************
        app.use(passport.session());
        // session() is a method of the Authenticator/Passport object returned by require("passport")
        // When passport.session() is called, it returns a middleware function suitable for passing to app.use().
        // passport.session()
        //     passport.authenticate("session")                                               [passport/lib/authenticator.js:233]
        //         passport._framework.authenticate(passport, "session", options, callback);  [passport/lib/authenticator.js:165]
        //             return function authenticate (req, res, next) { ... }         [passport/lib/middleware/authenticate.js:81]
        // This middleware causes the following function to be called for every request.
        // SessionStrategy.authenticate(req, options)                                     [passport/lib/strategies/session.js:37]
        //     var user_token = req._passport.session.user;
        //     req._passport.instance.deserializeUser(user_token, [req,] function(err, user) {
        //         req.user = user;
        //     });

        // When we execute passport.deserializeUser(), passport simply stores the function we give it.
        // That function is executed every request by the app.use(passport.session()) middleware.
        // The function takes the user-token that was saved (serialized) in the session and recovers the full user record
        // which gets put onto the request as req.user.
        passport.deserializeUser(function(email, done) {
            debug("passport.deserializeUser(%s)", email);
            User.findOne({email: email}, function(err, user) {
                debug("passport.deserializeUser(): user", user);
                done(err, user);
            });
        });

        var passportLocalStrategyOptions = {
            usernameField: "email",          // The default is "username". This overrides that so that my login form can say <input name="email">.
            passwordField: "password",       // "password" is the default, so I only did this for clarity. The login form will have <input name="password">.
            passReqToCallback: true          // (Note: this affects the signature of the verify callback (authUtils.verifyUserCredentials()))
        };

        // authUtils.verifyUserCredentials() is used as the "verify callback" described in the Passport documentation
        // Note: The default strategy name defined in the "passport-local" strategy is "local".
        //       It is the following statement that fixes the error 'Unknown authentication strategy "local"'.
        passport.use("local", new LocalStrategy(passportLocalStrategyOptions, authUtils.verifyUserCredentials));  // "local" is redundant/unnecessary
        // passport.use(fn) registers fn.authenticate() as the function to run for the fn.name strategy (the strategy name, fn.name, is "local" in this case)

        // This is where the Login form POSTs to
        // When we execute passport.authenticate(), a middleware function is returned that is compatible with app.post().
        // passport.authenticate("local")                                                 [passport/lib/authenticator.js:233]
        //     passport._framework.authenticate(passport, "local", options, callback);    [passport/lib/authenticator.js:165]
        //         return function authenticate (req, res, next) { ... }         [passport/lib/middleware/authenticate.js:81]
        // That function is executed every request
        app.post("/login",
            passport.authenticate("local", {   // the strategy name "local" tells it to call the correct Strategy.authenticate() function
                successRedirect: "/",
                failureRedirect: "/login",
                failureFlash: true
            })
        );

        // When we execute passport.serializeUser(), passport simply stores the function we give it.
        // That function is executed whenever req.login() is executed.
        // Save to Session: serializeUser() takes a full user record and boils it down to a single user-scalar
        //                  to save to the session that can be used later to recover the full user record.
        passport.serializeUser(function(user, done) {
            debug("passport.serializeUser(%j)", user);
            done(null, user.email);          // Often, this is the unique key into a database's user table to identify a user.
        });

        // **********************************************************************
        // Set Up Additional Routes
        // **********************************************************************

        // This is the URL that the logout action on the menu takes you to.
        // It performs the req.logout() and then redirects to the /login page.
        app.get("/logout", function (req, res, next) {
            req.logout();
            var redirect = (req.query && req.query.redirect) ? req.query.redirect : "/login";
            res.redirect(redirect);
        });

        app.post("/signup", authUtils.signup);                          // where the Sign Up form POSTs to
        app.get("/validate", authUtils.validate);                       // where the Validate email links to (GET)
        app.post("/validation-request", authUtils.validation_request);  // where the Validation Request form POSTs to
        app.get("/reset", authUtils.reset);                             // where the "Reset Password" email links to (GET)
        app.post("/reset-request", authUtils.reset_request);            // where the "Reset Password" form POSTs to

        // an Ajax API that can be used to log in from a single-page application (instead of a submitted form)
        app.post("/api/auth/login",
            passport.authenticate("local", {
                successRedirect: "/",
                failureRedirect: "/about",
                failureFlash: true
            })
        );

        // an Ajax API that can be used to log out from a single-page application (instead of GETing /logout and being redirected)
        app.post("/api/auth/logout",
            passport.authenticate("local", {
                successRedirect: "/",
                failureRedirect: "/login",
                failureFlash: true
            })
        );

        // an Ajax API that can be used to reset your password from a single-page application (instead of submitting a form)
        app.post("/api/auth/reset",
            passport.authenticate("local", {
                successRedirect: "/",
                failureRedirect: "/login",
                failureFlash: true
            })
        );
    },
    // verifyUserCredentials() is used as the "verify callback" described in the Passport documentation
    // Only the username/email and password exist currently. The req.sessionID exists, but the User record needs to be loaded.
    // Note: the function signature for verifyUserCredentials() only starts with a "req" because
    //       the passReqToCallback strategy option was set to true strategy option was set to true.
    // throughout this function, the Passport documentation says the argument before "password" is "username" but we configured it above to be "email" instead
    verifyUserCredentials: function (req, email, password, done) {
        // debug("authUtils.verifyUserCredentials(%s,%s)", email, password);
        // debug("authUtils.verifyUserCredentials() sessionID=%s", req.sessionID);
        // debug("authUtils.verifyUserCredentials() session=%j", req.session);
        User.findOne({ email: email }, function (err, user) {
            // console.log("verifyUserCredentials() User.findOne(%s) err, user", email, err, user);
            var info;
            if (err) {
                debug("authUtils.verifyUserCredentials() SYS-ERROR err", err);
                return done(err);
            }
            if (!user) {
                info = { message: 'User with email (' + email + ') was not found.<br>Please check the email address and log in again or go <a href="/signup">here</a> to sign up.', code: "AUTH-BADUSER" };
                debug("authUtils.verifyUserCredentials() AUTH-BADUSER info", info);
                return done(null, false, info);
            }
            var validation_request_url = "/validation-request?email="+encodeURIComponent(email);
            if (!user.verified) {
                info = { message: 'Email Not Yet Validated<br>Before you may log in, you must click the link in the validation email you received.<br>If you need another validation email, go <a href="'+validation_request_url+'">here</a>.', code: "AUTH-UNVERIFIED", redirect: validation_request_url };
                debug("authUtils.verifyUserCredentials() AUTH-UNVERIFIED info", info);
                return done(null, false, info);
            }
            //check if password matches and pass parameters in done accordingly
            else if (authUtils.isValidPassword(password, user.password)) {
                debug("authUtils.verifyUserCredentials() SUCCESS user", user);
                return done(null, user);
            }
            else {
                info = { message: 'Password incorrect.<br>Please try again or go <a href="/reset-request">here</a> to reset your password.', code: "AUTH-BADPASS" };
                debug("authUtils.verifyUserCredentials() AUTH-BADPASS info", info);
                return done(null, false, info);
            }
        });
    },
    signup: function (req, res, next) {
        var fullname = req.body.fullname || "";
        var email = req.body.email || "";
        var password = req.body.password || "";
        var password_confirm = req.body.password_confirm || "";
        if (!fullname || !email || !password || !password_confirm) {
            req.flash("error", "All of the required fields (with red stars) must be supplied.<br>Please try again.");
            res.redirect("/signup?email="+encodeURIComponent(email)+"&fullname="+encodeURIComponent(fullname));
            return;
        }
        if (password !== password_confirm) {
            req.flash("error", "Your two passwords don't match.<br>Please try again.");
            res.redirect("/signup?email="+encodeURIComponent(email)+"&fullname="+encodeURIComponent(fullname));
            return;
        }
        if (!authUtils.isPasswordStrongEnough(password)) {
            req.flash("error", "Your password is not strong enough.<br>Strong passwords should be at least 8 characters long and be made up of letters, numbers, and symbols.<br>Please try again.");
            res.redirect("/signup?email="+encodeURIComponent(email)+"&fullname="+encodeURIComponent(fullname));
            return;
        }
        var auth_code = User.generateAuthCode(email);
        var passwordHash = User.generateHash(password);
        var provided_auth_code = req.body.auth_code;
        var email_verified = User.isValidAuthCode(provided_auth_code, auth_code);
        var user = new User({
            email: email,
            fullname: fullname,
            password: passwordHash,
            auth_code: auth_code,
            verified: email_verified
        });
        // console.log("signup new user=%j", user);
        // console.log("signup req._passport", req._passport);
        // console.log("signup req.session", req.session);
        user.save(function (err) {
            if (err) {
                // console.log(err);
                // if (err.code === 11000) { }
                if (err.message.match(/duplicate key/)) {
                    req.flash("error", 'The user with that email ('+email+') has already signed up.<br>Please <a href="/login?email='+encodeURIComponent(email)+'">login</a> or sign up with a different email.');
                    res.redirect("/signup?email="+encodeURIComponent(email)+"&fullname="+encodeURIComponent(fullname));
                }
                else {
                    req.flash("error", "You were unsuccessful in signing up.<br>("+err.message+").<br>Please try again.");
                    res.redirect("/signup?email="+encodeURIComponent(email)+"&fullname="+encodeURIComponent(fullname));
                }
            }
            else {
                if (email_verified) {
                    req.login(user, function() {
                        req.flash("info", "You have successfully signed up, and you have been automatically logged in.");
                        res.redirect("/");
                    });
                }
                else {
                    var vhostOptions = httpUtils.virtualHostOptions(req);
                    var base_url = vhostOptions.base_url;

                    var validation_request_url = base_url+"/validation-request?email="+encodeURIComponent(email);
                    var validation_sent_url    = base_url+"/validation-sent?email="+encodeURIComponent(email);
                    var validate_url           = base_url+"/validate?email="+encodeURIComponent(email)+"&auth_code="+encodeURIComponent(auth_code);
                    var signup_url             = base_url+"/signup?email="+encodeURIComponent(email)+"&auth_code="+encodeURIComponent(fullname);

                    var mail_text = 'Hi '+fullname+',\n' +
                                    '\n' +
                                    'You have registered as a user\n' +
                                    'Please click on the following link (or copy it into your browser) in order to validate your email address.\n' +
                                    '\n' +
                                    '    '+validate_url+'\n' +
                                    '\n';
                    var mail_html = '<h1>Hi '+fullname+',</h1>\n' +
                                    '<p>You have registered as a user\n' +
                                    'Please click on the following link (or copy it into your browser) in order to validate your email address.</p>\n' +
                                    '<blockquote><a href="'+validate_url+'">'+validate_url+'</a></blockquote>\n' +
                                    "\n";
                    console.log("mailUtils.send() to", '"'+fullname+'" <'+email+'>');
                    console.log("mailUtils.send() text", mail_text);
                    console.log("mailUtils.send() html", mail_html);
                    mailUtils.send("validate_email", {
                        "to": '"'+fullname+'" <'+email+'>',
                        "text": mail_text,
                        "html": mail_html
                    }, function (err, result) {
                        if (err) {
                            req.flash("error", "There was an error sending your verification email ("+err.message+")");
                            res.redirect(signup_url);
                        }
                        else {
                            req.flash("info", "Email sent");
                            res.redirect(validation_sent_url);
                        }
                    });
                }
            }
        });
    },
    // POST
    validation_request: function (req, res, next) {
        var email = req.body.email || "";

        var validation_request_url = "/validation-request?email="+encodeURIComponent(email);
        var validation_sent_url    = "/validation-sent?email="+encodeURIComponent(email);
        var login_url = "/login?email="+encodeURIComponent(email);

        if (!email) {
            req.flash("error", "The email address must be supplied.<br>Please try again.");
            res.redirect(validation_request_url);
            return;
        }

        User.findOne({email: email}, function (err, user) {
            if (err) {
                req.flash("error", "You were unsuccessful in requesting a new validation email.<br>("+err.message+").<br>Perhaps try again.");
                res.redirect(validation_request_url);
            }
            else if (!user) {
                req.flash("error", "You were unsuccessful in requesting a new validation email.<br>A user with that email ("+email+") does not exist.");
                res.redirect(validation_request_url);
            }
            else if (user.verified) {
                req.flash("error", "That email is already validated. Please login.");
                res.redirect(login_url);
            }
            else {
                var auth_code = User.generateAuthCode(email);
                var fullname = user.fullname;
                user.auth_code = auth_code;
                user.verified = false;
                user.save(function (err) {
                    if (err) {
                        req.flash("error", "You were unsuccessful in requesting a new validation email.<br>("+err.message+").<br>Perhaps try again.");
                        res.redirect(validation_request_url);
                        return;
                    }
                    var vhostOptions = httpUtils.virtualHostOptions(req);
                    var base_url = vhostOptions.base_url;

                    var validate_url = base_url+"/validate?email="+encodeURIComponent(email)+"&auth_code="+encodeURIComponent(auth_code);

                    var mail_text = 'Hi '+fullname+',\n' +
                                    '\n' +
                                    'You have requested this validation email to complete the process of registering as a user.\n' +
                                    'Please click on the following link (or copy it into your browser) in order to validate your email address.\n' +
                                    '\n' +
                                    '    '+validate_url+'\n' +
                                    '\n';
                    var mail_html = '<h1>Hi '+fullname+',</h1>\n' +
                                    '<p>You have requested this validation email to complete the process of registering as a user.<br>\n' +
                                    'Please click on the following link (or copy it into your browser) in order to validate your email address.</p>\n' +
                                    '<blockquote><a href="'+validate_url+'">'+validate_url+'</a></blockquote>\n' +
                                    "\n";
                    console.log("mailUtils.send() html", mail_html);
                    mailUtils.send("validate_email", {
                        "to": '"'+fullname+'" <'+email+'>',
                        "text": mail_text,
                        "html": mail_html
                    }, function (err, result) {
                        if (err) {
                            req.flash("error", "There was an error sending your verification email ("+err.message+")");
                            res.redirect(validation_request_url);
                        }
                        else {
                            req.flash("info", "A new validation email has been sent.<br>This new email makes all old validation emails obsolete.<br>Please ensure you find this latest validation email and click on the link.");
                            res.redirect(validation_sent_url);
                        }
                    });
                });
            }
        });
    },
    // GET, POST
    validate: function (req, res, next) {
        var query = req.body || {};    // for GET requests
        if (req.query) {
            _.defaults(query, req.query);
        }
        console.log("validate() req.body", req.body);
        console.log("validate() req.query", req.query);
        console.log("validate() query", query);
        var email = query.email;
        var auth_code = query.auth_code;
        var validation_request_url = "/validation-request?email="+encodeURIComponent(email);
        var login_url              = "/login?email="+encodeURIComponent(email);
        var signup_url             = "/signup?email="+encodeURIComponent(email);
        if (!email || !auth_code) {
            req.flash("error", 'When trying to validate an email, either the email or the auth code was omitted.<br>Perhaps you need to request a new validation email.');
            res.redirect(validation_request_url);
        }
        else {
            User.findOne({email: email}, function (err, user) {
                if (err) {
                    req.flash("error", "An error occurred. ("+err.message+")");
                    if (req.method === "GET") {
                        res.redirect(validation_request_url);
                    }
                    else {
                        res.redirect(validation_request_url);
                    }
                }
                else if (!user) {
                    req.flash("error", "No user with that email ("+email+") has already been validated.<br>Please go ahead and log in.");
                    res.redirect(login_url);
                }
                else {
                    console.log("validate() user=%j", user);
                    if (user.verified) {
                        req.flash("error", "The email ("+email+") has already been validated.<br>Please go ahead and log in.");
                        res.redirect(login_url);
                    }
                    else if (user.isValidAuthCode(auth_code)) {
                        user.verified = true;
                        user.save(function (err) {
                            if (err) {
                                req.flash("error", "An error occurred updating your user record. ("+err.message+")");
                                res.redirect(validation_request_url);
                            }
                            else {
                                req.login(user, function() {
                                    req.flash("info", 'Your email has been validated and you are logged in.');
                                    res.redirect("/");
                                });
                            }
                        });
                    }
                    else {
                        req.flash("error", 'The auth code you used is not valid or has expired.<br>Please use the most recent one or request a new one.');
                        res.redirect(validation_request_url);
                    }
                }
            });
        }
    },
    // POST
    reset_request: function (req, res, next) {
        var email = req.body.email || "";

        var reset_request_url = "/reset-request?email="+encodeURIComponent(email);
        var reset_sent_url    = "/reset-sent?email="+encodeURIComponent(email);
        var login_url = "/login?email="+encodeURIComponent(email);

        if (!email) {
            req.flash("error", "The email address must be supplied.<br>Please try again.");
            res.redirect(reset_request_url);
            return;
        }

        User.findOne({email: email}, function (err, user) {
            if (err) {
                req.flash("error", "You were unsuccessful in requesting a password reset email.<br>("+err.message+").<br>Perhaps try again.");
                res.redirect(reset_request_url);
            }
            else if (!user) {
                req.flash("error", "You were unsuccessful in requesting a password reset email.<br>A user with that email ("+email+") does not exist.");
                res.redirect(reset_request_url);
            }
            else if (user.verified) {
                req.flash("error", "That email is already validated. Please login.");
                res.redirect(login_url);
            }
            else {
                var reset_code = User.generateAuthCode(email);
                var fullname = user.fullname;
                user.reset_code = reset_code;
                user.save(function (err) {
                    if (err) {
                        req.flash("error", "You were unsuccessful in requesting a password reset email.<br>("+err.message+").<br>Perhaps try again.");
                        res.redirect(reset_request_url);
                        return;
                    }
                    var vhostOptions = httpUtils.virtualHostOptions(req);
                    var base_url = vhostOptions.base_url;

                    var reset_url = base_url+"/reset?email="+encodeURIComponent(email)+"&reset_code="+encodeURIComponent(reset_code);

                    var mail_text = 'Hi '+fullname+',\n' +
                                    '\n' +
                                    'You have requested to reset your password.\n' +
                                    'Please click on the following link (or copy it into your browser) to proceed.\n' +
                                    '\n' +
                                    '    '+reset_url+'\n' +
                                    '\n';
                    var mail_html = '<h1>Hi '+fullname+',</h1>\n' +
                                    '<p>You have requested to reset your password.<br>\n' +
                                    'Please click on the following link (or copy it into your browser) to proceed.</p>\n' +
                                    '<blockquote><a href="'+reset_url+'">'+reset_url+'</a></blockquote>\n' +
                                    "\n";
                    console.log("mailUtils.send() html", mail_html);
                    mailUtils.send("reset_password", {
                        "to": '"'+fullname+'" <'+email+'>',
                        "text": mail_text,
                        "html": mail_html
                    }, function (err, result) {
                        if (err) {
                            req.flash("error", "There was an error sending your password reset email ("+err.message+")");
                            res.redirect(validation_request_url);
                        }
                        else {
                            req.flash("info", "The new validation email makes all old validation emails obsolete.<br>Please ensure you find this latest validation email and click on the link.");
                            res.redirect(validation_sent_url);
                        }
                    });
                });
            }
        });
    },
    reset: function (req, res, next) {
        var query = req.body || {};    // for GET requests
        if (req.query) {
            _.defaults(query, req.query);
        }
        var email = query.email;
        var reset_code = query.reset_code;
        var validation_request_url = base_url+"/validation-request?email="+encodeURIComponent(email);
        var login_url    = base_url+"/login?email="+encodeURIComponent(email);
        if (email && reset_code) {
            User.findOne({email: email}, function (err, user) {
                if (err) {
                    req.flash("error", "An error occurred. ("+err.message+")");
                    if (req.method === "GET") {
                        res.redirect(validation_request_url);
                    }
                    else {
                        res.redirect(validation_request_url);
                    }
                }
                else {
                    if (user.verified) {
                        req.flash("error", "The email ("+email+") has already been validated.<br>Please go ahead and log in.");
                        res.redirect(login_url);
                    }
                    else if (user.isValidAuthCode(reset_code)) {
                        req.flash("info", 'Your email has been validated and you are logged in.');
                        res.redirect("/");
                    }
                    else {
                        req.flash("error", 'The auth code you used is not valid or has expired.<br>Please use the most recent one or request a new one.');
                        res.redirect(validation_request_url);
                    }
                }
            });
        }
        else {
            req.flash("error", 'The auth code you used is not valid or has expired.<br>Please use the most recent one or request a new one.');
            res.redirect(validation_request_url);
        }
    },
    passwordStrength: function(password) {
        var strength = password.length;
        var num_char_types = 0;
        if (password.length >= 8) {
            if (password.match(/[a-z]/))        { num_char_types++; strength *= 1.0; }
            if (password.match(/[A-Z]/))        { num_char_types++; strength *= 1.2; }
            if (password.match(/[0-9]/))        { num_char_types++; strength *= 1.2; }
            if (password.match(/[^a-zA-Z0-9]/)) { num_char_types++; strength *= 1.6; }
            if (num_char_types > 1) {
                strength *= (0.8 + 0.2*num_char_types);
            }
        }
        return(strength);
    },
    isPasswordStrongEnough: function(password) {
        var strength = authUtils.passwordStrength(password);
        var minPasswordStrength = (config.general) ? (config.general.minPasswordStrength || 12) : 12;
        return(strength >= minPasswordStrength);
    }
};

module.exports = authUtils;

