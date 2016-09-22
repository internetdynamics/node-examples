node-examples
=============

I have been developing software for Node.js for over two years.
Yet I still think that I have missed the understanding of some parts.

This project is my own personal workspace for learning (and documenting that I have learned)
various steps of progressive complexity in Node software.
I hope that it is also therefore useful to others.

Main Websites

 * [Node Website](http://www.nodejs.org) - the main website for Node.js
   * [Node API Docs](https://nodejs.org/dist/latest-v4.x/docs/api/) - API docs for Node v4.x
   * [Node Starter Guide](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/) - entitled "Anatomy of an HTTP Transaction"
 * [Express Website](https://expressjs.com/) - the website for the Express framework for Node.js
   * [Express API Docs](https://expressjs.com/en/4x/api.html) - API docs for Express 4.x
   * [Express Starter Guide](https://expressjs.com/en/starter/hello-world.html) - "Hello World" for Express
   * [Common Express Middleware Modules](https://expressjs.com/en/resources/middleware.html) - common middleware modules
   * [Common Express Utility Modules](https://expressjs.com/en/resources/utils.html) - common utility modules

In general, we are going to follow the guides and documentation that are on the web.
However, we will build, each example upon the last, to create a coherent, meaningful application.

 http://expressjs.com/guide.html

 http://expressjs.com/4x/api.html
 http://expressjs.com/4x/api.html#application   app.set()/.get()
                                                app.use()/.route()
                                                app.all()
                                                app.engine()/.render()
                                                app.listen()

 http://expressjs.com/4x/api.html#request       req.params()/.query()/.param() .cookies()/.get() .protocol()/.hostname()/.path()/.url()/.originalUrl()
                                                    Examine the request from the browser.
 http://expressjs.com/4x/api.html#response      res.send()/.sendFile()/.json() .cookie()/.redirect()
                                                    Control the response to the browser.
 http://expressjs.com/4x/api.html#router        router.use()/.route() .all()/.VERB()
                                                    Routers can be thought of as "mini" applications, capable only of performing middleware and
                                                    routing functions. Every express application has a built-in app router.
 http://expressjs.com/4x/api.html#middleware    An Express application is essentially a stack of middleware (mw) which are functions executed serially on requests.
                                                    A middleware function has access to the request object (req), the response object (res),
                                                    and the next middleware in line in the request-response cycle of an Express application (next).

 http://cwbuecheler.com/web/tutorials/2013/node-express-mongo/
 http://cwbuecheler.com/web/tutorials/2014/restful-web-app-node-express-mongodb/

# Example 01: Write a Static Web Server (using Node and Express)

# Example 02: Add a JSON/REST API


