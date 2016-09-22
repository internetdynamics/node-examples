
var express = require('express');
var serveFavicon = require("serve-favicon");    // Serve a favicon
var serveIndex = require("serve-index");        // Serve directory listing for a given path
var fileStreamRotator = require('file-stream-rotator');  // Useful for morgan to create rotated log files
var morgan = require('morgan');                 // Create a typical HTTP log
var hoganExpress = require('hogan-express');

var port = 8008;
var logdir = "log";

var app = express();

// https://expressjs.com/en/4x/api.html#app.settings.table
app.set('case sensitive routing', true);
app.set('env',                    process.env.NODE_ENV || "development");
app.set('etag',                   "weak");
app.set('jsonp callback name',    "callback");
app.set('json replacer',          undefined);
app.set('json spaces',            undefined);
app.set('query parser',           "extended");
app.set('strict routing',         true);                   // When enabled, the router treats "/foo" and "/foo/" as different. (Not default value)
app.set('subdomain offset',       2);
app.set('trust proxy',            ['10.0.0.0/24', 'loopback', 'linklocal', 'uniquelocal']); // true behind Amazon load balancers
app.set('views',                  __dirname + '/views');
//app.set('view cache',             (process.env.NODE_ENV === "production") ? true : false);
app.set('view cache',             true);
app.set('view engine',            'html');
app.set('x-powered-by',           false);                  // not default
// *not sure this would work* app.set('port', process.env.PORT || 8008);
app.engine('html', hoganExpress);
//console.log("app.locals", app.locals);
//app.locals.app_local = 3.14;

// ---------------------------------------------------------------------------------
// Serve favicons from memory. Exclude from logs.
// app.use(serveFavicon(__dirname + '/public/favicon.ico'));

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
// Render views using Hogan template system
// * https://www.npmjs.com/package/hogan-express

app.set('layout', 'layouts/home.html');
app.set("partials", {
    "main_head":              "partials/main_head.html",
    "main_head_unscalable":   "partials/main_head_unscalable.html",
    "main_breadcrumbs":       "partials/main_breadcrumbs.html",
    "main_menu_header":       "partials/main_menu_header.html",
    "main_footer":            "partials/main_footer.html",
    "main_footer_scripts":    "partials/main_footer_scripts.html",
    "main_sitemap_hierarchy": "partials/main_sitemap_hierarchy.html",
    "home_main":              "partials/home_main.html",
    "home_carousel":          "partials/home_carousel.html",
    "home_portfolio_section": "partials/home_portfolio_section.html",
    "home_features_section":  "partials/home_features_section.html",
    "home_call_to_action":    "partials/home_call_to_action.html",
    "about_main":             "partials/about_main.html",
    "about_customers":        "partials/about_customers.html",
    "about_team":             "partials/about_team.html",
    "contact_form":           "partials/contact_form.html",
    "contact_map":            "partials/contact_map.html",
    "contact_details":        "partials/contact_details.html",
    "blog_search_well":       "partials/blog_search_well.html",
    "blog_categories_well":   "partials/blog_categories_well.html",
    "blog_home_1_entries":    "partials/blog_home_1_entries.html",
    "blog_home_2_entries":    "partials/blog_home_2_entries.html",
    "blog_widgets_well":      "partials/blog_widgets_well.html",
    "faq_entries":            "partials/faq_entries.html"
});

app.get([ "/", "/index", "/index.html" ], function (req, res, next) {
    res.render("index.html", {
        layout: "layouts/home.html",
        title: "Home"
    });
});
app.get([ "/about" ], function (req, res, next) {
    res.render("about.html", {
        layout: "layouts/about.html",
        title: "About"
    });
});
app.get([ "/contact" ], function (req, res, next) {
    res.render("contact.html", {
        layout: "layouts/contact.html",
        title: "Contact"
    });
});

app.get([ "/blog-home-1" ], function (req, res, next) {
    res.render("blog-home-1.html", {
        layout: "layouts/blog_home_1.html",
        title: "Blog Home 1"
    });
});
app.get([ "/blog-home-2" ], function (req, res, next) {
    res.render("blog-home-2.html", {
        layout: "layouts/blog_home_2.html",
        title: "Blog Home 2"
    });
});
app.get([ "/blog-post" ], function (req, res, next) {
    res.render("blog-post.html", {
        layout: "layouts/blog_post.html",
        title: "Blog Post"
    });
});
app.get([ "/portfolio-item" ], function (req, res, next) {
    res.render("portfolio-item.html", {
        layout: "layouts/portfolio_item.html",
        title: "Portfolio Item"
    });
});
app.get([ "/faq" ], function (req, res, next) {
    res.render("faq.html", {
        layout: "layouts/faq.html",
        title: "FAQ"
    });
});

app.get([ "/portfolio-1-col" ], function (req, res, next) {
    res.render("portfolio-1-col.html", {
        layout: "layouts/portfolio_1col.html",
        title: "Portfolio 1 Column"
    });
});
app.get([ "/portfolio-2-col" ], function (req, res, next) {
    res.render("portfolio-2-col.html", {
        layout: "layouts/portfolio_2col.html",
        title: "Portfolio 2 Columns"
    });
});
app.get([ "/portfolio-3-col" ], function (req, res, next) {
    res.render("portfolio-3-col.html", {
        layout: "layouts/portfolio_3col.html",
        title: "Portfolio 3 Columns"
    });
});
app.get([ "/portfolio-4-col" ], function (req, res, next) {
    res.render("portfolio-4-col.html", {
        layout: "layouts/portfolio_4col.html",
        title: "Portfolio 4 Columns"
    });
});

app.get([ "/404" ], function (req, res, next) {
    res.render("404.html", {
        layout: "layouts/error404.html",
        title: "Error 404"
    });
});

app.get([ "/full-width" ], function (req, res, next) {
    res.render("full-width.html", {
        layout: "layouts/full_width.html",
        title: "Full Width"
    });
});
app.get([ "/sidebar" ], function (req, res, next) {
    res.render("sidebar.html", {
        layout: "layouts/sidebar.html",
        title: "Sidebar"
    });
});
app.get([ "/pricing" ], function (req, res, next) {
    res.render("pricing.html", {
        layout: "layouts/pricing.html",
        title: "Pricing"
    });
});
app.get([ "/services" ], function (req, res, next) {
    res.render("services.html", {
        layout: "layouts/services.html",
        title: "Services"
    });
});

// ---------------------------------------------------------------------------------
// Serve static files (and indexes of directories)
app.use(express["static"](__dirname+"/public"));
app.use('/', serveIndex('public', {'icons': true}))

// ---------------------------------------------------------------------------------
// Handle Errors
app.use(function(req, res, next) {
  res.status(404).send("Not Found");
});

// ---------------------------------------------------------------------------------
// Handle Errors
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// ---------------------------------------------------------------------------------
// Start the server
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

