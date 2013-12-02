(function () {
    'use strict';

    var OssError = require('./error.js');

    var Router = function (logger) {
        var self = this;

        self._name = name;
        self._logger = logger;
    };

    // @param callback {function} - callback function with arguments (OssError, { body, headers })
    Parser.prototype.route = function (opt, callback) {
        // validate the opt
        if (!opt.bucketName) {
            callback(new OssError(400, 'InvalidBucketName', 'The bucket name (' + opt.bucketName + 'was invalid.'), null);
        }
    };

    module.exports = Router;

})();