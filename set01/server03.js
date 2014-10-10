
var express = require('express');
var fs = require('fs');
var async = require('async');
var when = require('when');
var deasync = require('deasync');
var timekit = require('timekit');

var app = express();

app.use(function (req, res, next) {
    console.log("request: %s params=%j query=%j : %s %s %s", req.path, req.params, req.query, req.protocol, req.hostname, req.url);
    next();
});

app.use(express["static"](__dirname+"/htdocs"));
app.use("/assets", express["static"](__dirname+"/assets"));

app.get("/api", function (req, res) {
    var url = req.url
    res.json({
        "/api/list/sync": {
            url: "http:/api/list/sync"
        },
        "/api/list/when": {
            url: "http:/api/list/when"
        },
        "/api/list/async": {
            url: "http:/api/list/async"
        },
        "/api/list/deasync": {
            url: "http:/api/list/deasync"
        }
    });
});

app.get("/about", function (req, res) {
    res.send(
        "<!doctype html>\n"+
        "<html>\n"+
        "<head>\n"+
        "  <title>API Home Page</title>\n"+
        "</head>\n"+
        "<body>\n"+
        "  <h1>API Home Page</h1>\n"+
        "  <ul>\n"+
        "    <li><a href='/api/list/sync'>/api/list/sync</a></li>\n"+
        "    <li><a href='/api/list/when'>/api/list/when</a></li>\n"+
        "    <li><a href='/api/list/async'>/api/list/async</a></li>\n"+
        "    <li><a href='/api/list/deasync'>/api/list/deasync</a></li>\n"+
        "  </ul>\n"+
        "</body>\n"+
        "</html>\n");
});

app.get(/\/api\/([^\/]+)\/([^\/]+)(.*)$/, function (req, res) {
    var start_usec = timekit.time();
    var path = req.path;

    var sendResults = function (err, results) {
        var end_usec = timekit.time();
        var elapsed_sec = (end_usec-start_usec)/1000000;
        if (err) {
            res.json({
                success: false,
                elapsed_sec: elapsed_sec,
                message: err
            });
        }
        else {
            res.json({
                success: true,
                elapsed_sec: elapsed_sec,
                results: results
            });
        }
    }

    var op       = req.params[0];
    var approach = req.params[1];
    var abspath  = __dirname + (req.params[2] || "");

    if (op !== "list") {
        res.json({
            success: false,
            message: "op ["+op+"] not yet implemented",
        });
        return;
    }

    if      (approach === "sync")    { listSync(abspath, path, sendResults); }
    else if (approach === "when")    { listWhen(abspath, path, sendResults); }
    else if (approach === "async")   { listAsync(abspath, path, sendResults); }
    else if (approach === "deasync") { listDeasync(abspath, path, sendResults); }
    else {
        res.json({
            success: false,
            message: "approach ["+approach+"] not recognized",
        });
    }
});

app.get("/api/:service/:op", function (req, res) {
    var start_usec = timekit.time();
    var end_usec = timekit.time();
    var elapsed_sec = (end_usec-start_usec)/1000000;

    res.json({
        success: false,
        message: "not yet implemented",
        elapsed_sec: elapsed_sec,
        params: req.params,
        query: req.query,
        body: req.body
    });
});

function listSync(path, urlbase, callback) {
    var filenames = fs.readdirSync(path);
    var fileinfo = [];
    var i, len, filename, fstats, finfo;
    len = filenames.length;
    for (i = 0; i < len; i++) {
        filename = filenames[i];
        fstats = fs.lstatSync(path+"/"+filename);
        finfo = {
            filename: filename,
            stat: fstats
        };
        if (fstats.isDirectory()) {
            finfo.url = "http:"+urlbase+"/"+filename;
        }
        fileinfo.push(finfo);
    }
    callback(null, fileinfo);
}

function listAsync(path, urlbase, callback) {
    fs.readdir(path, function (err, filenames) {
        if (err) { callback(err); }
        else {
            var fileinfo = [];
            async.each(filenames,
                function(filename, next) {
                    fs.lstat(path+"/"+filename, function (err, fstats) {
                        var finfo = {
                            filename: filename,
                            stat: fstats
                        };
                        if (fstats.isDirectory()) {
                            finfo.url = "http:"+urlbase+"/"+filename;
                        }
                        fileinfo.push(finfo);
                        next(err);
                    });
                },
                function (err) {
                    if (err) callback(err);
                    else     callback(null, fileinfo);
                });
        }
    });
}

function when_readdir (path) {
    var deferred = when.defer();
    fs.readdir(path, function (err, filenames) {
        if (err) deferred.reject(err);
        else     deferred.resolve(filenames);
    });
    return(deferred.promise);
}

function when_lstat (path) {
    var deferred = when.defer();
    fs.lstat(path, function (err, fstats) {
        if (err) deferred.reject(err);
        else     deferred.resolve(fstats);
    });
    return(deferred.promise);
}

function listWhen(path, urlbase, callback) {
    when_readdir(path)
    .then(function (filenames) {
        var lstat_promises = [];
        var i, len, filename, fstats, finfo;
        len = filenames.length;
        for (i = 0; i < len; i++) {
            filename = filenames[i];
            lstat_promises.push(when_lstat(path+"/"+filename));
        }
        return(when.all(lstat_promises)
        .then(function (fstats_array) {
            var fileinfo = [];
            var i, len, filename, fstats, finfo;
            len = filenames.length;
            for (i = 0; i < len; i++) {
                filename = filenames[i];
                fstats = fstats_array[i];
                finfo = {
                    filename: filename,
                    stat: fstats
                };
                if (fstats_array[i].isDirectory()) {
                    finfo.url = "http:"+urlbase+"/"+filename;
                }
                fileinfo.push(finfo);
            }
            callback(null, fileinfo);
        }));
    })
    .catch(function (err) {
        callback(err);
    })
}

function deasync_readdirSync (path) {
    var filenames, err, done = false;
    fs.readdir(path, function (_err, _filenames) {
        if (_err) { err       = _err;       done = true; }
        else      { filenames = _filenames; done = true; }
    });
    while (!done) { deasync.runLoopOnce(); }
    if (err) throw new Error(err);
    return(filenames);
}

function deasync_lstatSync (path) {
    var fstats, err, done = false;
    fs.lstat(path, function (_err, _fstats) {
        if (_err) { err    = _err;    done = true; }
        else      { fstats = _fstats; done = true; }
    });
    while (!done) { deasync.runLoopOnce(); }
    if (err) throw new Error(err);
    return(fstats);
}

function listDeasync(path, urlbase, callback) {
    var filenames = deasync_readdirSync(path);
    var fileinfo = [];
    var i, len, filename, fstats, finfo;
    len = filenames.length;
    for (i = 0; i < len; i++) {
        filename = filenames[i];
        fstats = deasync_lstatSync(path+"/"+filename);
        finfo = {
            filename: filename,
            stat: fstats
        };
        if (fstats.isDirectory()) {
            finfo.url = "http:"+urlbase+"/"+filename;
        }
        fileinfo.push(finfo);
    }
    callback(null, fileinfo);
}

var server = app.listen(8000, function() {
    console.log('Listening on port %d', server.address().port);
});

