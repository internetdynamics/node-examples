
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// {
//     "_id" : "ZbTCdXi3tRY0p78-xy4OaS04CcZYP89B",
//     "session" : {
//         "cookie" : {
//             "originalMaxAge" : null,
//             "expires" : null,
//             "secure" : false,
//             "httpOnly" : true,
//             "domain" : ".buildingportal.com",
//             "path" : "/",
//             "sameSite" : null
//         },
//         "startDttm" : ISODate("2016-09-15T21:23:49.090Z"),
//         "lastDttm" : ISODate("2016-09-15T21:31:56.587Z"),
//         "pageHits" : 3,
//         "breadcrumbs" : [  "index",  "login" ],
//         "flash" : {  }
//     },
//     "expires" : ISODate("2016-09-29T21:31:56.591Z") 
// }

var schema = new Schema(
    {
        "_id":            { type: ObjectId },     // will automatically have an index
        "session":        { type: { "cookie": {}, "startDttm": Date, "lastDttm": Date, "pageHits": Number, "breadcrumbs": [ String ], "flash": {} } },
        "createDttm":     { type: Date,       index: true },
        "updateDttm":     { type: Date,       index: true }
    },
    {
        autoIndex: true,          // (default is true) probably should be false in production due to performance impact
        collection: "session",    // specify the physical table name
        strict: true,             // (default is true) true = extra fields not in the schema are not saved to the database
        timestamps: { createdAt: "createDttm", updatedAt: "updateDttm" }
    }
);

var User = mongoose.model('User', schema);

module.exports = User;

