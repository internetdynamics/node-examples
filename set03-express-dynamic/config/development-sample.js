
var config = {
    general: {
        minPasswordStrength: 12
    },
    cookie_session: {
        config: {
            "name": "node-demo-cs-dev",
            // "keys": ["8652dcfc-cc0b-4226-b723-91f44f899118", "c3d84060-427b-4ad5-b565-b161b8363702"],
            "secret": 'key1.secret99'
            "maxage": 157680000000,   // milliseconds to expiration (this says the cookie will be good for about 5 years) (157680000000 = 5*365*24*3600*1000)
            "path": "/",
            "domain": ".democorporation.com",
            "port": 8008,
            "secureProxy": false,
            "secure": false,
            "signed": false,
            "httpOnly": true
        }
    },
    express_session: {
        config: {
            "name": "node-demo-es-dev",
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
            "connect" : "mongodb://username:pass@mongodbhost/nodedemo_dev_db?authSource=admin"
        }
    },
    "mail": {
        "config": {
            "host": "smtp.democorporation.com",
            "port": 25,
            "secure": false,
            "ignoreTLS": true
        },
    }
};

module.exports = config;

