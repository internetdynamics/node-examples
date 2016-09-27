
var config = require("../config");
var _ = require("lodash");

var lastSessionId = null;

var sessionUtils = {
    // allocateSessionId() is used for cookie-session, where there is no sessionID.
    // It should not be called if you are using express-session.
    allocateSessionId: function(req, time) {
        if (req.session) {
            if (!req.session.sessionId) {
                if (req.sessionID) {    // using "express-session"
                    req.session.sessionId = req.sessionID;
                }
                else {                  // using something else which has no sessionId concept (e.g. "cookie-session")
                    if (!time) {
                        time = Date.now();
                    }
                    if (lastSessionId && lastSessionId >= time) {
                        lastSessionId++;
                    }
                    else {
                        lastSessionId = time;
                    }
                    req.session.sessionId = lastSessionId;
                }
            }
        }
    },
    // keepSessionTimes() ensures that we know when the session started and when it was last accessed
    // It will also be used to write old segments of the session to the session table with auto-allocated ID's
    // so that we can track periods of use.
    // According to this technical approach, each session can be long-running (spanning even years).
    // This routine will keep a record of each segment of use where the time of disuse was under one hour.
    // Only the active segment will retain the sessionID as the session._id field, but each record in the
    // session table will have the session.sessionId fields, so that periods of active use can be tied together
    // across the longer "session".
    keepSessionTimes: function(req, time) {
        if (req.session) {
            if (!time) {
                time = Date.now();
            }
            if (!req.session.startDttm) {
                req.session.startDttm = new Date(time);
            }
            req.session.lastDttm = new Date(time);
        }
    },
    countPageHits: function(req, hits) {
        if (req.session) {
            if (!hits) {
                hits = 1;
            }
            if (!req.session.pageHits) {
                req.session.pageHits = hits;
            }
            else {
                req.session.pageHits += hits;
            }
        }
    },
    // <li><a{{#viewClass}} class="{{viewClass}}"{{/viewClass}}{{#viewRoute}} href="{{viewRoute}}"{{/viewRoute}}>{{viewLabel}}</a></li>
    trackBreadcrumbs: function(req, res, currentViewName) {
        if (req.session) {
            if (!req.session.breadcrumbs) {
                req.session.breadcrumbs = [];
            }
            var numBreadcrumbs = req.session.breadcrumbs.length;
            var foundIndex = _.indexOf(req.session.breadcrumbs, currentViewName);   // search for the current view among recently visited views
            // console.log("trackBreadcrumbs(%s): %d in %j", currentViewName, foundIndex, req.session.breadcrumbs);
            if (foundIndex < 0) {                                 // if we have not yet visited this view ...
                req.session.breadcrumbs.push(currentViewName);    // put this new view on the end
                numBreadcrumbs++;                                 // ... and adjust the count of breadcrumbs
            }
            else if (foundIndex < numBreadcrumbs-1) {             // if we visited the view but it's not the one we're currently on ...
                req.session.breadcrumbs.splice(foundIndex+1, numBreadcrumbs-foundIndex-1);   // trim off the pages we've seen since that page
                numBreadcrumbs = req.session.breadcrumbs.length;  // ... and adjust the count of breadcrumbs
            }
            else {  // (foundIndex === numBreadcrumbs-1)          // else we are revisiting the last view we already visited
                // do nothing
            }
            if (config.view) {
                var maxDisplayedBreadcrumbs = 5;
                var numBreadcrumbsSkipped = (numBreadcrumbs > maxDisplayedBreadcrumbs) ? (numBreadcrumbs - maxDisplayedBreadcrumbs) : 0;
                res.locals.breadcrumbs = [];                      // initialize the array of view info for rendering in the breadcrumbs section on the page
                var i, viewName, viewDef, viewRoute, viewLabel, viewClass;
                for (i = 0; i < numBreadcrumbs; i++) {
                    viewName = req.session.breadcrumbs[i];
                    viewDef = config.view[viewName];
                    if (numBreadcrumbsSkipped > 0 && i >= 1 && i <= numBreadcrumbsSkipped) {
                        if (i === 1) {
                            res.locals.breadcrumbs.push({
                                viewLabel: "..."
                            });
                        }
                    }
                    else if (viewDef && viewDef.route) {
                        viewRoute = viewDef.route;
                        if (viewRoute && typeof(viewRoute) === "object" && viewRoute.length) {
                            viewRoute = viewRoute[0];
                        }
                        if (viewDef.render_options) {
                            viewLabel = viewDef.render_options.title;
                        }
                        else {
                            viewLabel = viewName;
                        }
                        if (currentViewName === viewName) {
                            viewClass = "active";
                        }
                        else {
                            viewClass = "";
                        }
                        res.locals.breadcrumbs.push({
                            viewName: viewName, 
                            viewRoute: viewRoute, 
                            viewLabel: viewLabel,
                            viewClass: viewClass
                        });
                    }
                }
            }
        }
    },
    makeLocals: function(req, res) {
        // console.log("makeLocals() req.params", req.params);
        if (res.locals) {
            if (req.session) {
                // retrieves AND clears req.session.flash ({ "error": ["errmsg1", "errmsg2"], "info": ["infomsg1"] })
                var flash = req.flash();
                // put into res.locals to be accessible by the templating system
                res.locals.flash_info = flash.info;
                res.locals.flash = flash.error;
                if (req.user) {
                    res.locals.user = req.user;
                }
            }
            if (req.query) {
                _.defaults(res.locals, req.query);
                // console.log("makeLocals() res.locals", res.locals);
            }
        }
    }
};

module.exports = sessionUtils;

