
var config = {
    app: {
        settings: {

            // these are set onto the Express app in the main "app.js" or "server.js" file
            "case sensitive routing": true,
            "etag":                   "weak",
            "jsonp callback name":    "callback",
            "json replacer":          undefined,
            "json spaces":            undefined,
            "query parser":           "extended",
            "strict routing":         true,                    // When enabled, the router treats "/foo" and "/foo/" as different. (Not default value)
            "subdomain offset":       2,
            "trust proxy":            ["10.0.0.0/24", "loopback", "linklocal", "uniquelocal"],  // true behind Amazon load balancers
            "view cache":             true,
            "view engine":            "html",
            "x-powered-by":           false,                   // not default

            layout: 'layouts/home.html',
            partials: {
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
            }
        },
        // These are variables which are "local" to the Express app, but because the app is everything, they are really app global variables.
        // They are copied from this config file to app.locals in the app.js/server.js file.
        // They can be used directly in templates as "{{varname}}" because Express passes them to every call of res.render() automatically.
        locals: {
            site_name: "Demo Company"
        }
    },
    // these views are set onto a route in "routes/pages.js" and use()d as pagesRoute on the Express app in the main app.js/server.js file
    view: {
        "index": {
            method: "get",
            route: ["/", "index"],
            content_template: "index.html",
            render_options: {
                layout: "layouts/home.html",
                title: "Home"
            }
        },
        "about": {
            method: "get",
            route: [ "/about" ],
            content_template: "about.html",
            render_options: {
                layout: "layouts/about.html",
                title: "About"
            }
        },
        "contact": {
            method: "get",
            route: [ "/contact" ],
            content_template: "contact.html",
            render_options: {
                layout: "layouts/contact.html",
                title: "Contact"
            }
        },
        "blog-home-1": {
            method: "get",
            route: [ "/blog-home-1" ],
            content_template: "blog-home-1.html",
            render_options: {
                layout: "layouts/blog_home_1.html",
                title: "Blog Home 1"
            }
        },
        "blog-home-2": {
            method: "get",
            route: [ "/blog-home-2" ],
            content_template: "blog-home-2.html",
            render_options: {
                layout: "layouts/blog_home_2.html",
                title: "Blog Home 2"
            }
        },
        "blog-post": {
            method: "get",
            route: [ "/blog-post" ],
            content_template: "blog-post.html",
            render_options: {
                layout: "layouts/blog_post.html",
                title: "Blog Post"
            }
        },
        "portfolio-item": {
            method: "get",
            route: [ "/portfolio-item" ],
            content_template: "portfolio-item.html",
            render_options: {
                layout: "layouts/portfolio_item.html",
                title: "Portfolio Item"
            }
        },
        "faq": {
            method: "get",
            route: [ "/faq" ],
            content_template: "faq.html",
            render_options: {
                layout: "layouts/faq.html",
                title: "FAQ"
            }
        },
        "portfolio-1-col": {
            method: "get",
            route: [ "/portfolio-1-col" ],
            content_template: "portfolio-1-col.html",
            render_options: {
                layout: "layouts/portfolio_1col.html",
                title: "Portfolio 1 Column"
            }
        },
        "portfolio-2-col": {
            method: "get",
            route: [ "/portfolio-2-col" ],
            content_template: "portfolio-2-col.html",
            render_options: {
                layout: "layouts/portfolio_2col.html",
                title: "Portfolio 2 Columns"
            }
        },
        "portfolio-3-col": {
            method: "get",
            route: [ "/portfolio-3-col" ],
            content_template: "portfolio-3-col.html",
            render_options: {
                layout: "layouts/portfolio_3col.html",
                title: "Portfolio 3 Columns"
            }
        },
        "portfolio-4-col": {
            method: "get",
            route: [ "/portfolio-4-col" ],
            content_template: "portfolio-4-col.html",
            render_options: {
                layout: "layouts/portfolio_4col.html",
                title: "Portfolio 4 Columns"
            }
        },
        "404": {
            method: "get",
            route: [ "/404" ],
            content_template: "404.html",
            render_options: {
                layout: "layouts/error404.html",
                title: "Error 404"
            }
        },
        "full-width": {
            method: "get",
            route: [ "/full-width" ],
            content_template: "full-width.html",
            render_options: {
                layout: "layouts/full_width.html",
                title: "Full Width"
            }
        },
        "sidebar": {
            method: "get",
            route: [ "/sidebar" ],
            content_template: "sidebar.html",
            render_options: {
                layout: "layouts/sidebar.html",
                title: "Sidebar"
            }
        },
        "pricing": {
            method: "get",
            route: [ "/pricing" ],
            content_template: "pricing.html",
            render_options: {
                layout: "layouts/pricing.html",
                title: "Pricing"
            }
        },
        "services": {
            method: "get",
            route: [ "/services" ],
            content_template: "services.html",
            render_options: {
                layout: "layouts/services.html",
                title: "Services"
            }
        }
    }
};

module.exports = config;

