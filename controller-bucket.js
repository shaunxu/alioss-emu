(function () {
    'use strict';

    var util = require('util');
    var fs = require('fs');
    var path = require('path');

    var errors = require('./errors.js');
    var Controller = require('./controller.js');

    var BucketController = function (logger) {
        Controller.call(this, 'Bucket', logger);
    };
    util.inherits(BucketController, Controller);

    BucketController.prototype._getBucketPath = function (rv) {
        return path.join(rv.root, rv.bucketName);
    };

    BucketController.prototype.put = function (req, rv, callback) {
        var self = this;

        var bucketPath = self._getBucketPath(rv);
        var headers = self.defaultHeaders(rv);
        headers['Location'] = '/' + rv.bucketName;
        // check if the bucket exists
        fs.exists(bucketPath, function (exists) {
            if (exists) {
                // return if bucket exists
                // TODO: validate if the bucket's owner is the requestor
                callback(null, null, headers);
            }
            else {
                // create a folder for this bucket with relevant meta
                fs.mkdir(bucketPath, function (error) {
                    if (error) {
                        self._logger.error('BucketController.prototype.put(), create bucket folder failed. ', 'bucketPath: ', bucketPath, ', Error: ', error);
                        callback(errors.InternalError, null, null);
                    }
                    else {
                        var meta = { 'acl': 'private' };
                        self.saveMeta(bucketPath, meta, function (error) {
                            if (error) {
                                callback(error, null, null);
                            }
                            else {
                                callback(null, null, headers);
                            }
                        });
                    }
                });
            }
        });
    };

    BucketController.prototype.list = function (req, rv, callback) {
        var self = this;

        var headers = self.defaultHeaders(rv);
        // find all folders under the root path
        
    };

    module.exports = BucketController;

})();