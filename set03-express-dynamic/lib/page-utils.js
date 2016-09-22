var express = require('express');
var config = require("../config");
var sessionUtils = require("./session-utils");

var view;

var pageUtils = {
    configure: function (app) {
        if (config.view) {
            for (viewName in config.view) {
                view = config.view[viewName];
                if (view.method && view.route && view.content_template) {
                    (function () {     // run this in a function so that the router's callback will see variables appropriate for this iteration
                        var v = view;
                        var vname = viewName;
                        var options = v.render_options || {};
                        app[v.method](v.route, function (req, res, next) {
                            var now = Date.now();
                            // allocateSessionId() is used for cookie-session, where there is no sessionId.
                            // It should not be called if you are using express-session.
                            sessionUtils.allocateSessionId(req, now);
                            sessionUtils.keepSessionTimes(req, now);
                            sessionUtils.countPageHits(req);
                            sessionUtils.trackBreadcrumbs(req, res, vname);
                            sessionUtils.makeLocals(req, res);
                            // console.log("pageUtils.handler() req.sessionID", req.sessionID);
                            // console.log("pageUtils.handler() req.session", req.session);
                            // console.log("pageUtils.handler() res.locals", res.locals);
                            res.render(v.content_template, options);
                        });
                    })();
                }
            }
        }
    }
};

module.exports = pageUtils;
