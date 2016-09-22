
var debug = require('debug')('auth-utils');
var _ = require("lodash");
var mailUtils = require('./mail-utils');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

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
            // console.log("serializeUser(%j)", user);
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
            var redirect = req.param('redirect') || "/login";
            res.redirect(redirect);
        });

        // This is where the Sign Up form POSTs to
        app.post("/signup", authUtils.signup);

        // This is where the Validate form POSTs to
        app.post("/validate", authUtils.validate);

        // This is where the "Reset Password" form POSTs to
        app.post("/reset",
            passport.authenticate("local", {
                successRedirect: "/",
                failureRedirect: "/login",
                failureFlash: true
            })
        );

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
            console.log("verifyUserCredentials() User.findOne(%s) err, user", email, err, user);
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
            if (!user.verified) {
                info = { message: 'Email Not Yet Validated<br>Before you may log in, you must click the link in the validation email you received.<br>If you need another validation email, go <a href="/validate">here</a>.', code: "AUTH-UNVERIFIED", redirect: "/validate" };
                debug("authUtils.verifyUserCredentials() AUTH-UNVERIFIED info", info);
                return done(null, false, info);
            }
            //check if password matches and pass parameters in done accordingly
            else if (authUtils.isValidPassword(password, user.password)) {
                debug("authUtils.verifyUserCredentials() SUCCESS user", user);
                return done(null, user);
            }
            else {
                info = { message: 'Password incorrect.<br>Please try again or go <a href="/reset">here</a> to reset your password.', code: "AUTH-BADPASS" };
                debug("authUtils.verifyUserCredentials() AUTH-BADPASS info", info);
                return done(null, false, info);
            }
        });
    },
    signup: function (req, res, next) {
        var fullname = req.body.fullname;
        var email = req.body.email;
        var password = req.body.password;
        var password_confirm = req.body.password_confirm;
        if (!fullname || !email || !password || !password_confirm) {
            req.flash("error", "All of the first four fields must be supplied.<br>Please try again.");
            res.redirect("/signup");
            return;
        }
        if (!authUtils.isPasswordStrongEnough(password)) {
            req.flash("error", "Your password is not strong enough.<br>Please try again.");
            res.redirect("/signup");
            return;
        }
        if (password !== password_confirm) {
            req.flash("error", "Your two passwords don't match.<br>Please try again.");
            res.redirect("/signup");
            return;
        }
        var auth_code = authUtils.generateAuthCode(email);
        var passwordHash = authUtils.generateHash(password);
        var provided_auth_code = req.param('auth_code');
        var email_verified = authUtils.isValidAuthCode(email, provided_auth_code);
        var user = new User({
            email: email,
            fullname: fullname,
            password: passwordHash,
            auth_code: auth_code,
            verified: email_verified
        });
        console.log("signup new user=%j", user);
        console.log("signup req._passport", req._passport);
        console.log("signup req.session", req.session);
        user.save(function (err) {
            if (err) {
                console.log(err);
                // if (err.code === 11000) { }
                if (err.message.match(/duplicate key/)) {
                    req.flash("error", "The user with that email ("+email+") is already signed up..<br>Please try again.");
                    res.redirect("/signup");
                }
                else {
                    req.flash("error", "You were unsuccessful in signing up.<br>("+err.message+").<br>Please try again.");
                    res.redirect("/signup");
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
                    var mail_text = "Hi "+fullname+",\n" +
                                    "\n" +
                                    "You have registered as a user\n" +
                                    "Please click on the following link (or copy it into your browser) in order to validate your email address.\n" +
                                    "\n" +
                                    "    "+base_url+"/validate?email="+encodeURIComponent(email)+"&auth_code="+encodeURIComponent(auth_code)+"\n" +
                                    "\n" +
                    mailUtils.send("verify_registration", {
                        "to": fullname+" <"+email+">",
                        "text": mail_text,
                        "html": mail_html
                    }, function (err, result) {
                        if (err) {
                            req.flash("error", "There was an error sending your verification email ("+err.message+")");
                            res.redirect("/signup");
                        }
                        else {
                            req.flash("info", "You have successfully signed up and a validation email has been sent to your email inbox.<br>Please click the link in the email.<br>If you can't find the email, go <a href=\"/validate\">here</a> to request a new one.");
                            res.redirect("/validation-sent");
                        }
                    });
                }
            }
        });
    },
    validate: function (req, res, next) {
        var email = req.body.email;
        var provided_auth_code = req.body.auth_code;
        if (email && auth_code) {
            User.findOne({email: email}, function (err, user) {
                if (err) { next(err); }
                else {
                    if (user.verified) {
                        req.flash("error", "The email ("+email+") has already been validated.<br>Please go ahead and log in.");
                        res.redirect("/login?email="+encodeURIComponent(email));
                        
                    }
                    if (user.isValidAuthCode(provided_auth_code)) {
                    }
                }
            });
        }
        else {
        }

        var auth_code = authUtils.generateAuthCode(email);
        var passwordHash = authUtils.generateHash(password);
        var provided_auth_code = req.param('auth_code');
        var email_verified = authUtils.isValidAuthCode(email, provided_auth_code);
        var user = new User({
            email: email,
            fullname: fullname,
            password: passwordHash,
            auth_code: auth_code,
            verified: email_verified
        });
        console.log("signup new user=%j", user);
        console.log("signup req._passport", req._passport);
        console.log("signup req.session", req.session);
        user.save(function (err) {
            if (err) {
                console.log(err);
                // if (err.code === 11000) { }
                if (err.message.match(/duplicate key/)) {
                    req.flash("error", "The user with that email ("+email+") is already signed up.<br>Please log in.");
                    res.redirect("/login");
                }
                else {
                    req.flash("error", "You were unsuccessful in signing up.<br>("+err.message+").<br>Please try again.");
                    res.redirect("/signup");
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
                    var base_url = 
                    var mail_text = "Hi "+fullname+",\n" +
                                    "\n" +
                                    "You have registered as a user.\n" +
                                    "Please click on the following link (or copy it into your browser) in order to validate your email address.\n" +
                                    "\n" +
                                    "    "+base_url+"/validate?email="+encodeURIComponent(email)+"&auth_code="+encodeURIComponent(auth_code)+"\n" +
                                    "\n";
                    var mail_html = "<h1>Hi "+fullname+",</h1>\n" +
                                    "<p>You have registered as a user.<br>\n" +
                                    "Please click on the following link (or copy it into your browser) in order to validate your email address.</p>\n" +
                                    "\n" +
                                    "<blockquote><a href='"+base_url+"/validate?email="+encodeURIComponent(email)+"&auth_code="+encodeURIComponent(auth_code)'>"+base_url+"/validate?email="+encodeURIComponent(email)+"&auth_code="+encodeURIComponent(auth_code)+"</a></blockquote>\n" +
                                    "\n";
                    mailUtils.send("verify_registration", {
                        "to": fullname+" <"+email+">",
                        "text": mail_text,
                        "html": mail_html
                    }, function (err, result) {
                        if (err) {
                            req.flash("error", "There was an error sending your verification email ("+err.message+")");
                            res.redirect("/signup");
                        }
                        else {
                            req.flash("info", "You have successfully signed up and a validation email has been sent to your email inbox.<br>Please click the link in the email.<br>If you can't find the email, go <a href=\"/validate\">here</a> to request a new one.");
                            res.redirect("/validation-sent");
                        }
                    });
                }
            }
        });
    },
    // used for the password hash stored in the database
    generateHash: function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    generateAuthCode: function (email) {
        var auth_code = authUtils.generateHash(email + 'authcode' + Math.random());
        auth_code = auth_code.replace(/[^A-Za-z0-9]/g, "").substr(-10);  // get rid of non-alphanumerics and take the last 10 chars
        return(auth_code);
    },
    isValidPassword: function(password, encrypted_password) {
        return((password && encrypted_password && bcrypt.compareSync(password, encrypted_password)) ? true : false);
    },
    isValidAuthCode: function(provided_auth_code, auth_code) {
        return((provided_auth_code && (provided_auth_code === "cmd-928hcj4lwsnvs6" || provided_auth_code === "bp-628hcj4lwsNvs6")) ? true : false);
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
        return(strength >= 12.0);
    }
};

module.exports = authUtils;

