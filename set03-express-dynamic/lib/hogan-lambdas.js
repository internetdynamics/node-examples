
var eval_expr = function(expr, ctx) {
    var expr1, expr2, matches, op, part, parts, ref, val, _i, _len;
    matches = [];
    if (expr) {
        expr = expr.trim();
    }
    val = null;
    if (typeof expr !== "string") {
        val = expr;
    }
    else if ((matches = expr.match(/^"(.*)"$/))) {
        val = matches[1];
    }
    else if ((matches = expr.match(/^'(.*)'$/))) {
        val = matches[1];
    }
    else if (expr.match(/^-?[0-9]+$/)) {
        val = parseInt(expr, 10);
    }
    else if (expr.match(/^-?[0-9]*\.[0-9]+$/)) {
        val = parseFloat(expr);
    }
    else if ((matches = expr.match(/^\{([a-zA-Z0-9_\/\.]+)\}$/))) {
        parts = matches[1].split(".");
        ref = ctx;
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (ref && typeof ref === "object") {
                if (ref[part]) {
                    ref = ref[part];
                }
                else {
                    ref = null;
                }
            }
        }
        val = ref;
    }
    else if ((matches = expr.match(/^(.*[^ ]) *(!=|==|>|<|>=|<=) *([^ ].*)$/))) {
        expr1 = eval_expr(matches[1], ctx);
        op = matches[2];
        expr2 = eval_expr(matches[3], ctx);
        if (op === "==") {
            val = expr1 === expr2;
        }
        else if (op === "!=") {
            val = expr1 !== expr2;
        }
        else if (op === "<") {
            val = expr1 < expr2;
        }
        else if (op === ">") {
            val = expr1 > expr2;
        }
        else if (op === "<=") {
            val = expr1 <= expr2;
        }
        else if (op === ">=") {
            val = expr1 >= expr2;
        }
        else {
            val = false;
        }
    }
    else {
        val = expr;
    }
    return val;
};

var lambdas = {
    lowercase: function(text) {
        return text.toLowerCase();
    },
    titleCase: function(text) {
        text = text.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, function($1) {
            return $1.toUpperCase();
        });
        return text;
    },
    formatPhone: function(phone) {
        phone = phone.replace(/[^0-9]/g, "");
        phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
        return phone;
    },
    urlencode: function(text, ctx) {
        return encodeURIComponent(text);
    },
    urldecode: function(text, ctx) {
        return decodeURIComponent(text);
    },
    auth_code: function(text, ctx) {
        return "bp-628hcj4lwsNvs6";
    },
    isActive: function(text, ctx) {
        var activeCls, view;
        view = ctx.view || ctx.parent.view;
        activeCls = ctx.activeCls || ctx.parent.activeCls;
        if (activeCls == null) {
            activeCls = 'active';
        }
        if (text === view) {
            return activeCls;
        }
        else {
            return '';
        }
    },
    ifLoggedIn: function(text, ctx) {
        //console.log("lambdas.ifLoggedIn() text", text);
        //console.log("lambdas.ifLoggedIn() ctx", ctx);
        var user = null;
        if (ctx && ctx.user) {
            user = ctx.user;
        }
        else if (ctx && ctx.parent && ctx.parent.user) {
            user = ctx.parent.user;
        }
        if (user && user.username !== 'guest') {
            return text;
        }
        else {
            return '';
        }
    },
    ifNotLoggedIn: function(text, ctx) {
        //console.log("lambdas.ifNotLoggedIn() text", text);
        //console.log("lambdas.ifNotLoggedIn() ctx", ctx);
        var user = null;
        if (ctx && ctx.user) {
            user = ctx.user;
        }
        else if (ctx && ctx.parent && ctx.parent.user) {
            user = ctx.parent.user;
        }
        if (!(user && user.username !== 'guest')) {
            return text;
        }
        else {
            return '';
        }
    },
    prettyUserName: function(text, ctx) {
        var user = null;
        if (ctx && ctx.user) {
            user = ctx.user;
        }
        else if (ctx && ctx.parent && ctx.parent.user) {
            user = ctx.parent.user;
        }
        if (!user) {
            return text;
        }
        else if (user.nick_name) {
            return user.nick_name;
        }
        else if (user.first_name) {
            return user.first_name;
        }
        else if (user.fullname) {
            return user.fullname;
        }
        else if (user.username) {
            return user.username;
        }
        else {
            return user.email;
        }
    },
    condition: function(text, ctx) {
        var all_lines, cond, line, lines, matches, return_text, _i, _len;
        cond = false;
        all_lines = text.split("\n");
        lines = [];
        matches = [];
        for (_i = 0, _len = all_lines.length; _i < _len; _i++) {
            line = all_lines[_i];
            if ((matches = line.match(/^ *(else *)?if *\((.*)\) *\{ *\r?$/))) {
                cond = eval_expr(matches[2], ctx);
                lines = [];
            }
            else if ((matches = line.match(/^ *} *(else *)?({ *)?\r?$/))) {
                if (cond) {
                    break;
                }
                else {
                    lines = [];
                    cond = false;
                }
            }
            else {
                lines.push(line);
            }
        }
        if (cond) {
            return_text = lines.join("\n");
        }
        else {
            return_text = "";
        }
        return return_text;
    }
};

module.exports = lambdas;

