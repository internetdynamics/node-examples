
var config = require("../config");
var _ = require("lodash");
var nodemailer = require("nodemailer");

var transport = nodemailer.createTransport(config.mail.config);

var mailUtils = {
    /*
     * options: (see: https://github.com/nodemailer/nodemailer)
     *     "from":          "Contact <no-reply@democorporation.com>",
     *     "to":            "Support <support@democorporation.com>",
     *     "cc":            "joe@mycompany.com",
     *     "bcc":           "josephine@mycompany.com",
     *     "subject":       "Contact Message",
     *     "text":          "Hi,\nThis is an email message.",
     *     "text":          { path: "mail/send_greeting.txt" },
     *     "text_template": "mail/send_greeting.txt",                   ### TEMPLATES NOT YET IMPLEMENTED ###
     *     "html":          "Hi,\nThis is an <b>email message</b>.",
     *     "html":          { path: "mail/send_greeting.html" },
     *     "html_template": "mail/send_greeting.html",                  ### TEMPLATES NOT YET IMPLEMENTED ###
     *     "attachments":   [ { path: "mail/images/logo.png", cid: "logo" } ],
     */
    send: function(messageName, options, callback) {
        var msg = _.clone(options);
        if (config.mail[messageName]) {
            _.defaults(msg, config.mail[messageName]);
        }
        transport.sendMail(msg, callback);
    }
};

module.exports = mailUtils;

