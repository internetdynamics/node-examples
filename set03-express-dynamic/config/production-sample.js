
var config = {
    // these views are set onto a route in "routes/pages.js" and use()d as pagesRoute on the Express app in the main app.js/server.js file
    cookie_session: {
        config: {
            "name": "node-demo-cs",
            "secret": 'key1.secret99'
            "maxage": 157680000000,   // milliseconds to expiration (this says the cookie will be good for about 5 years) (157680000000 = 5*365*24*3600*1000)
            "path": "/",
            "domain": ".democorporation.com",
            "secureProxy": true,
            "secure": false,
            "signed": false,
            "httpOnly": true
        }
    },
    express_session: {
        config: {
            "name": "node-demo-es",
            "secret": 'key1.secret99'
            "resave": false,
            "saveUninitialized": true,
            "cookie": {
                // "maxAge": 157680000000,   // milliseconds to expiration (this says the cookie will be good for about 5 years) (157680000000 = 5*365*24*3600*1000)
                "maxAge": null,    // the cookie will disappear when the browser closes (unless the "Remember Me" checkbox is checked)
                "path": "/",
                "domain": ".democorporation.com",
                "secure": false,
                "httpOnly": true
            }
            // store: new MongoStore({ mongooseConnection: mongoose.connection })
        }
    },
    "mongoose": {
        "db": {
            "connect" : "mongodb://username:pass@mongodbhost/nodedemo_prod_db?authSource=admin"
        }
    },
    "mail": {
        "config": {
            "host": "smtp.democorporation.com",
            "port": 25,
            "secure": false,
            "ignoreTLS": true
        }
    }
};

module.exports = config;

