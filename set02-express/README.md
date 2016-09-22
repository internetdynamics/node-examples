
  npm install --save express
  npm install --save body-parser
  npm install --save cookie-parser
  npm install --save serve-static
  npm install --save serve-index
  npm install --save serve-favicon
  npm install --save response-time

 * [Node HTTP Doc for Request (http.IncomingMessage)](https://nodejs.org/api/http.html#http_message_headers)
 * [Node API Docs](https://nodejs.org/dist/latest-v4.x/docs/api/) - API docs for Node v4.x
 * [Express API Docs](https://expressjs.com/en/4x/api.html) - API docs for Express 4.x
 * [Modern Business Bootstrap Theme](https://startbootstrap.com/template-overviews/modern-business/)

# Rendering

## Mustache vs Hogan (hogan.js)

There are a lot of different variations of template language syntax.
Furthermore, the idea of "logic-less" templates promotes the separation of content (templates) from logic (implemented in a programming language).
Thus, the Mustache template specification was created which defines the template syntax independent of any programming language.

There are many implementations of the Mustache templates in different languages.
Hogan (or "hogan.js") is one of the Mustache template implementations in Javascript, written by some developers at Twitter.

## Express, hogan-express, and hogan.js

Express has a general way of handling rendering of content (templates and variables), but it depends on the underlying template engine to perform the
actual work.

## hogan-express vs. hjs vs. consolidate

There are multiple adapters for Hogan to make it compatible with Express.

Hogan.js does not support layouts natively, so "hogan-express" implements layouts on top of "hogan.js",
effectively calling the native Hogan render() function twice for each page.

The "consolidate" adapter does not support this, and I couldn't tell if the built-in "hjs" adapter supports it, so I consider "hogan-express" to be 
the most appropriate adapter to use for Hogan.

## Render Logic

Rendering a page is mainly accomplished in one way.
This emits the contents of the rendered content to the output stream and completes the request.

  res.render(content_path, options);

If you wanted to render to a string and continue processing the request, you would supply a callback, which you might do if you were using templates to render
emails, but that's a different case.

  res.render(content_path, options, function (err, str) { ... });

### Content Path

The content_path should be the path to the content to be rendered, relative to the views directory, with or without its file extension (e.g. "index.html" or "index").

If the extension is not given, the default extension is tried. This default extension is set with the following Express setting.

  app.set('view engine', 'html');  // sets the default extension for view rendering

### Options

The options that you pass to render() are primarily variables and values (template variables) that will be used in rendering the content template,
the layout template, and any of the partials templates that may be required.
However, both Express and "hogan-express" perform additional logic to automatically merge variables and values from other locations into the options before it passes
them to "hogan.js".
Furthermore, there are some special keys in the options object which specify things other than variables.

When you call res.render(content_template, options),
Express puts the following keys into the options object that you pass to render() before it gets to the "hogan-express" render() function.

 * options.settings - This object contains all of the values from the Express app which were set with "app.set('var', value);". This should not be overridden
 * options._locals - (_) This object contains all of the values that were in res.locals.
 * options.cache   - This is a boolean that comes from "app.set('view cache', true);". (So options.cache === options.settings["view cache"].)
 * options.[key]   - Express copies all key/value pairs in app.locals (a.k.a. req.app.locals) and in res.locals into options

Therefore, in addition to the values you pass to render() in options, app.settings, app.locals, res.locals all affect the resulting values in options.

### Variables

In any of the templates, a set of double curly-braces (mustaches) identify a template variable (e.g. "{{title}}").

  <!doctype html>
  <html>
  <head>
    <title>{{title}}</title>
  </head>
  <body>
    <h1>{{title}}</h1>
    <p>This paragraph is about {{title}}.</p>
  </body>
  </html>

 * any of the keys in options represents a template variable and its value for substitution

### Layout

A layout may be specified in either of the following two places, relative to the views directory, with or without its file extension
(e.g. "layouts/default.html" or "layouts/default").
If the layout file cannot be found, it is ignored silently without an error and the content is rendered without a surrounding layout.
If the layout file is found, it is rendered and the content template is inserted into the layout in place of the "{{{yield}}}" tag.

 * options.settings.layout
 * options.layout            [overrides options.settings.layout]

Because the layout must be relative to the "views" directory, I suggest a convention where all of the layouts exist
in a subdirectory of the views directory called "layouts".

Here is a sample layout template which includes some partials and then yields for content to be inserted.

  {{>main_head}}
  <body>
  {{>main_menu_header}}
      <div id="main-container" class="container">
  {{{yield}}}
          <hr>
  {{>main_footer}}
      </div>
  {{>main_footer_scripts}}
  </body>
  </html>

### Partials

A "partial" is a snippet of text to be inserted into another larger template.
In other template systems, these are sometimes called "blocks".
A "partial" is inserted into a template by using the "{{>name_of_partial}}" syntax.

The list of partials is an object where each key is the name of a partial and the value is the path to the partial file,
relative to the views directory, with or without its file extension.

 * options.settings.partials
 * options.partials          [merge/override with options.settings.layout]

Because the path to the partial file must be relative to the "views" directory, I suggest a convention where all of the partials exist
in a subdirectory of the views directory called "partials".

Thus in this example, we might have the following directory structure.

  views                                     # the root directory of all of the Hogan/Mustache templates
  views/home.html                           # this is the content for the Home page
  views/about.html                          # this is the content for another hypothetical page
  views/contact.html                        # this is the content for another hypothetical page
  views/products.html                       # this is the content for another hypothetical page

  views/layouts                             # the subdirectory for all of the layouts
  views/layouts/default.html                # this is the default layout
  views/layouts/home.html                   # perhaps you need a special layout for the home page

  views/partials                            # the subdirectory for all of the partials
  views/partials/main_head.html             # this is a partial
  views/partials/main_menu_header.html      # this is a partial
  views/partials/main_footer.html           # this is a partial
  views/partials/main_footer_scripts.html   # this is a partial

### Lambdas

 * options.settings.lambdas
 * options.lambdas           [merge/override with options.settings.layout]

### Details

This logic is from node_modules/hogan-express/hogan-express.js (the render() function at the bottom).

  render = function(path, opt, fn) {
    console.log("XXX render() this/ctx:", this);
    console.log("XXX render() path:", path);
    console.log("XXX render() opt:", opt);
    var lambda, lambdas, name, partials, _fn;
    ctx = this;
    partials = opt.settings.partials || {};
    if (opt.partials) {
      partials = __extends(partials, opt.partials);
    }
    console.log("XXX render() partials:", partials);
    lambdas = opt.settings.lambdas || {};
    if (opt.lambdas) {
      lambdas = __extends(lambdas, opt.lambdas);
    }
    // console.log("XXX render() lambdas:", lambdas);
    delete lambdas['prototype'];
    delete lambdas['__super__'];
    opt.lambdas = {};
    _fn = function(name, lambda) {
      return opt.lambdas[name] = function() {
        var lcontext;
        lcontext = this;
        return function(text) {
          var lctx;
          lctx = {};
          if (opt._locals) {
            lctx = __extends(lctx, opt._locals);
          }
          lctx = __extends(lctx, lcontext);
          return lambda(hogan.compile(text).render(lctx));
        };
      };
    };
    for (name in lambdas) {
      lambda = lambdas[name];
      _fn(name, lambda);
    }
    // console.log("XXX render() after lambdas:", lambdas);
    return renderPartials(partials, opt, function(err, partials) {
      console.log("XXX render() -> renderPartials() partials:", partials);
      var layout;
      if (err) {
        return fn(err);
      }
      layout = opt.layout === void 0 ? opt.settings.layout : layout = opt.layout;
      // console.log("XXX render() -> renderPartials() opt:", opt);
      // console.log("XXX render() -> renderPartials() layout:", layout);
      return renderLayout(layout, opt, function(err, layout) {
        // console.log("XXX render() -> renderPartials() -> renderLayout() err:", err);
        // console.log("XXX render() -> renderPartials() -> renderLayout() layout:", layout);
        // console.log("XXX render() -> renderPartials() -> renderLayout() opt:", opt);
        return read(path, opt, function(err, str) {
          // console.log("XXX render() -> renderPartials() -> renderLayout() -> read() str:", str);
          var customTag, customTags, result, tag, tmpl, _i, _len;
          if (err) {
            return fn(err);
          }
          try {
            tmpl = hogan.compile(str, opt);
            result = tmpl.render(opt, partials);
            customTags = str.match(/({{#yield-\w+}})/g);
            if (layout) {
              if (customTags) {
                for (_i = 0, _len = customTags.length; _i < _len; _i++) {
                  customTag = customTags[_i];
                  tag = customTag.match(/{{#([\w-]+)}}/)[1];
                  if (tag) {
                    opt[tag] = customContent(str, tag, opt, partials);
                  }
                }
              }
              opt["yield"] = result;
              tmpl = hogan.compile(layout, opt);
              result = tmpl.render(opt, partials);
            }
            return fn(null, result);
          } catch (_error) {
            err = _error;
            return fn(err);
          }
        });
      });
    });
  };
TODO

  morgan
  winston
  sessions

