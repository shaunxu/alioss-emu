(function () {
    'use strict';

    var uuid = require('uuid');

    var errors = require('./errors.js');

    var Parser = function (name, logger) {
        var self = this;

        self._name = name;
        self._logger = logger;
    };

    Parser.prototype._validateBucketName = function (bucketName) {
        // bypass if no bucket name specified
        if (!bucketName || bucketName === '') {
            return true;
        }
        // length must between 3 - 63
        var length = bucketName.length;
        if (length < 3 || length > 63) {
            return false;
        }
        for (var i = 0; i < length; i++) {
            var charCode = bucketName.charCodeAt(i);
            // should be ok if lower case char or number
            if ((charCode >= 97 && charCode <= 122) || (charCode >= 48 && charCode <= 57)) {
            }
            else {
                // if this is NOT first char, `-` should be ok, too
                if (i > 0 && charCode == 45) {
                }
                else {
                    return false;
                }
            }
        }
        return true;
    };

    Parser.prototype._validateObjectName = function (objectName) {
        // bypass if no object name specified
        if (!objectName || objectName === '') {
            return true;
        }
        // length must between 1 - 1023
        var length = objectName.length;
        if (length < 1 || length > 1023) {
            return false;
        }
        // TODO: must utf-8 encoded
        // must NOT starts with `/` or `\`
        var charCode = objectName.charCodeAt(0);
        return (charCode != 47) && (charCode != 92);
    };
    
    // @param req {object} - original request
    // @param root {string} - the root path for local oss, will be passed to underlying fs module
    // @param callback {function} - { error, route_value }
    Parser.prototype.parse = function (req, root, callback) {
        var self = this;
        // populate default route value
        var rv = {
            // app level information
            root: root,
            // calculated members
            requestId: uuid.v4(),
            authorization: req.headers['Authorization'],
            contentLength: req.headers['Content-Length'],
            contentType: req.headers['Content-Type'],
            date: req.headers['Date'],
            host: req.headers['Host'],
            // populated by sub parser
            bucketName: null,
            objectName: null,
            // raw values
            method: req.method,
            headers: req.headers,
            params: req.query
        };
        // invoke the virtual method for route value from sub classes
        self.onParse(rv, req);
        var error = null;
        // validate bueckt name if applicable
        if (error && !self._validateBucketName(rv.bucketName)) {
            error = errors.InvalidBucketName;
        }
        // validate object name if applicable
        if (error && !self._validateObjectName(rv.objectName)) {
            error = errors.InvalidObjectName;
        }
        // callback if all validation passed
        callback(error, rv);
    };

    // @param rv {object} - route value populated by Parser.prototype.parse
    // @param req {object} - original request
    Parser.prototype.onParse = function (rv, req) {
        var self = this;
        return rv;
    };

    module.exports = Parser;

})();