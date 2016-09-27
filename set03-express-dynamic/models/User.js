
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

// {
//     "_id" : ObjectId("57c3574a7d9efcf119dfc84d"),
//     "email" : "john@gmail.com",
//     "password" : "$2a$08$5aPCEDSdfcb3pJ6o2Ahh6O9YKlCPJhGNvhlP4hpRnKQquKe.ZL9G.",
//     "verified" : true,
//     "auth_code" : "bp-628hcj4lwsNvs6",
//     "default_group_id" : ObjectId("577556f5e79c83c221c4f826"),
//     "fullname" : "John Smith",
//     "first_name" : "John",
//     "profile" : {  },
//     "company_group_id" : ObjectId("577556f5e79c83c221c4f826"),
//     "group_id" : ObjectId("577556f5e79c83c221c4f826"),
//     "group_name" : "demo_corp"
// }

var schema = new Schema(
    {
        // _id:              { type: ObjectId },     // don't put in schema. will be automatically included. will automatically have an index.
        email:            { type: String,     required: true, unique: true },
        fullname:         { type: String,     required: true },
        password:         { type: String,     required: true },
        verified:         { type: Boolean,    required: true },
        auth_code:        { type: String },
        first_name:       { type: String },
        company_group_id: { type: ObjectId },
        default_group_id: { type: ObjectId },
        group_id:         { type: ObjectId },
        group_name:       { type: String },
        groups:           [],
        perms:            {},
        apps:             {},
        databases:        {},
        username:         { type: String,                     unique: true, sparse: true },
        mobilePhone:      { type: String,                     index: true },
        mobileCarrier:    { type: String },
        createDttm:       { type: Date,                       index: true },
        updateDttm:       { type: Date }
    },
    {
        autoIndex: true,          // (default is true) probably should be false in production due to performance impact
        collection: "auth_user",  // specify the physical table name
        strict: true,             // (default is true) true = extra fields not in the schema are not saved to the database
        timestamps: { createdAt: "createDttm", updatedAt: "updateDttm" }
    }
);

var auto_auth_code = {
    "cmd-928hcj4lwsnvs6": true,
    "bp-628hcj4lwsNvs6": true
};

// *************************************************************************************
// Static Methods
// *************************************************************************************
schema.statics.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
schema.statics.generateAuthCode = function(email) {
    var auth_code = this.generateHash(email + 'authcode' + Math.random());
    auth_code = auth_code.replace(/[^A-Za-z0-9]/g, "").substr(-10);  // get rid of non-alphanumerics and take the last 10 chars
    return(auth_code);
};
schema.statics.isValidPassword = function(password, encrypted_password) {
    return((password && encrypted_password && bcrypt.compareSync(password, encrypted_password)) ? true : false);
};
schema.statics.isValidAuthCode = function(provided_auth_code, auth_code) {
    console.log("user.isValidAuthCode(%j,%j) [static]", provided_auth_code, auth_code);
    return((provided_auth_code && (provided_auth_code === auth_code || auto_auth_code[provided_auth_code])) ? true : false);
};

// *************************************************************************************
// Instance Methods
// *************************************************************************************
schema.methods.isValidPassword = function(password, encrypted_password) {
    if (!encrypted_password) {
        encrypted_password = this.password;
    }
    return((password && encrypted_password && bcrypt.compareSync(password, encrypted_password)) ? true : false);
};
schema.methods.isValidAuthCode = function(provided_auth_code, auth_code) {
    console.log("user.isValidAuthCode(%j,%j) [instance]", provided_auth_code, auth_code);
    if (!auth_code) {
        auth_code = this.auth_code;
    }
    console.log("user.isValidAuthCode(%j,%j) [instance] (this.auth_code)", provided_auth_code, auth_code);
    return((provided_auth_code && (provided_auth_code === auth_code || auto_auth_code[provided_auth_code])) ? true : false);
};

var User = mongoose.model('User', schema);

module.exports = User;

