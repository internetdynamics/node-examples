var express = require('express');
var router = express.Router();
var config = require("../config");

var view;

if (config.view) {
    for (view_name in config.view) {
        view = config.view[view_name];
        if (view.method && view.route && view.content_template) {
            (function () {     // run this in a function so that the router's callback will see variables appropriate for this iteration
                var v = view;
                var options = v.render_options || {};
                router[v.method](v.route, function (req, res, next) {
                    res.render(v.content_template, options);
                });
            })();
        }
    }
}

module.exports = router;
