
var config = require("../config");
var _ = require("lodash");
var nodemailer = require("nodemailer");

console.log("mail.config", config.mail.config);
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
     *     "text":          { template: "mail/send_greeting.txt" },                   ### TEMPLATES NOT YET IMPLEMENTED ###
     *     "html":          "Hi,\nThis is an <b>email message</b>.",
     *     "html":          { path: "mail/send_greeting.html" },
     *     "html":          { template: "mail/send_greeting.html" },                  ### TEMPLATES NOT YET IMPLEMENTED ###
     *     "attachments":   [ { path: "mail/images/logo.png", cid: "logo" } ],
     */
    send: function(messageName, options, callback) {
        var values = _.clone(options);
        if (config.mail && config.mail.message && config.mail.message[messageName]) {
            _.defaults(values, config.mail.message[messageName]);
        }
        console.log("mailUtils.send(%s) values", messageName, values);
        if (!values.from || !values.to || !values.subject || !values.text) {
            callback(new Error("Mail message ("+messageName+") is missing one or more of from/to/subject/text"));
            console.log("ERROR: mailUtils.send(%s) values", messageName, values);
        }
        else {
            var msg = {
                from: values.from,
                to: values.to,
                subject: values.subject,
                text: values.text
            };

            if (values.cc) { msg.cc = values.cc; }
            if (values.bcc) { msg.bcc = values.bcc; }
            if (values.html) { msg.html = values.html; }
            if (values.attachments) { msg.attachments = values.attachments; }

            var step1 = function () {
                if (msg.text && typeof(msg.text) === "object" && msg.text.template) {
                    var template = msg.text.template;
                    //mailUtils.render( ... );
                    //not yet implemented
                }
                else {
                    step2();
                }
            };
            var step2 = function () {
                step3();
            };
            var step3 = function () {
                step4();
            };
            var step4 = function () {
                transport.sendMail(msg, callback);
            };
            step1();
        }
    },
    render: function (template_text, values, callback) {
    }
};

module.exports = mailUtils;

