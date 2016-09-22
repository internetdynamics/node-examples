
var config = require("../config");
var _ = require("lodash");

var virtualHostOptionsCache = {};

var httpUtils = {
    // baseUrl(req) examines the request and returns a URL like "http://localhost:8080" or "https://www.democorporation.com".
    baseUrl: function (req) {
        var base_url, port, port_str, x_forwarded_port, _ref, _ref1;
        var host = req.get("host");
        var x_forwarded_proto = req.get("x-forwarded-proto");
        var proto = x_forwarded_proto != null ? x_forwarded_proto : "http";
        var matches = [];
        if (host != null) {
            base_url = proto + "://" + host;
        } else {
            x_forwarded_port = req.get("x-forwarded-port");
            if (x_forwarded_port) {
                port = x_forwarded_port;
                port_str = (proto === "http" && port === "80") || (proto === "https" && port === "443") ? "" : ":" + req.port;
            } else if (matches = (_ref = req.client.server) != null ? (_ref1 = _ref._connectionKey) != null ? _ref1.match(/:([0-9]+)$/) : void 0 : void 0) {
                port = matches[1];
                port_str = (proto === "http" && port === "80") || (proto === "https" && port === "443") ? "" : ":" + req.port;
            } else {
                port_str = "";
            }
            base_url = proto + "://" + req.hostname + port_str;
        }
        return(base_url);
    },
    // virtualHostOptions(req) examines the request and returns an object of settings specific to the base_url
    virtualHostOptions: function (req) {
        var config_host, config_site6, domain_spec, _ref, _ref1, _ref2;
        var base_url = httpUtils.baseUrl(req);
        var vhost_key = ((_ref = req.session) != null ? _ref.host : void 0) ? "" + base_url + ":" + req.session.host : base_url;
        if (!virtualHostOptionsCache[vhost_key]) {
            var host = req.get("host");
            if (host == null) {
                host = req.hostname;
            }
            host = host.replace(/:[0-9]+$/, "");
            if (host === "127.0.0.1") {
                host = "localhost";
            }
            var domain_parts = host.split(".");
            var num_domain_parts = domain_parts.length;
            var n = num_domain_parts - 1;
            if (num_domain_parts === 1) {
                domain_spec = domain_parts[0];
            } else if (num_domain_parts >= 3 && domain_parts[n].length === 2 && domain_parts[n - 1] === "co") {
                domain_spec = domain_parts[n - 2];
            } else {
                domain_spec = domain_parts[n - 1];
            }
            var site6 = (config.workbench_options && config.workbench_options.site6) ? config.workbench_options.site6 : domain_spec.substr(0, 6);
            var vhost_options = {
                base_url: base_url,
                host: host,
                site6: site6
            };
            if (((_ref1 = req.session) != null ? _ref1.host : void 0) && req.session.host !== host) {
                config_host = (_ref2 = req.session) != null ? _ref2.host : void 0;
                domain_parts = config_host.split(".");
                num_domain_parts = domain_parts.length;
                n = num_domain_parts - 1;
                if (num_domain_parts === 1) {
                    domain_spec = domain_parts[0];
                } else if (num_domain_parts >= 3 && domain_parts[n].length === 2 && domain_parts[n - 1] === "co") {
                    domain_spec = domain_parts[n - 2];
                } else {
                    domain_spec = domain_parts[n - 1];
                }
                config_site6 = domain_spec.substr(0, 6);
                vhost_options.config_host = config_host;
                vhost_options.config_site6 = config_site6;
            }
            virtualHostOptionsCache[vhost_key] = vhost_options;
        }
        return virtualHostOptionsCache[vhost_key];
    }
};

module.exports = httpUtils;

