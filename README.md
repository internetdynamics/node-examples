node-examples
=============

Examples for use in learning node and Express

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


