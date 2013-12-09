(function () {
    'use strict';

    var util = require('util');
    var fs = require('fs');
    var path = require('path');
    var async = require('async');

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
        var headers = {
            'Location': '/' + rv.bucketName,
        };
        // check if the bucket exists
        fs.exists(bucketPath, function (exists) {
            if (exists) {
                // return if bucket exists
                // TODO: validate if the bucket's owner is the requestor
                callback(null, null, null, headers);
            }
            else {
                // create a folder for this bucket with relevant meta
                fs.mkdir(bucketPath, function (error) {
                    if (error) {
                        self._logger.error('BucketController.prototype.put(), create bucket folder failed. ', 'bucketPath: ', bucketPath, ', Error: ', error);
                        callback(errors.InternalError, null, null, null);
                    }
                    else {
                        var meta = { 'acl': 'private' };
                        self.saveMeta(bucketPath, meta, function (error) {
                            if (error) {
                                callback(error, null, null, null);
                            }
                            else {
                                callback(null, null, null, headers);
                            }
                        });
                    }
                });
            }
        });
    };

    BucketController.prototype.list = function (req, rv, callback) {
        var self = this;

        // find all folders under the root path
        fs.readdir(rv.root, function (error, files) {
            if (error) {
                self._logger.error('BucketController.prototype.list(), fs.readdir() failed. ', 'Root: ', rv.root, ', Error: ', error);
                callback(errors.InternalError, null, null, null);
            }
            else {
                var handlers = {};
                for (var i = 0; i < files.length; i++) {
                    (function (file) {
                        var handler = function (cb) {
                            fs.stat(file, function (error, stat) {
                                if (error) {
                                    self._logger.error('BucketController.prototype.list(), fs.stat() failed. ', 'File: ', file, ', Error: ', error);
                                    cb(error, null);
                                }
                                else {
                                    if (stat.isDirectory()) {
                                        var bucket = {
                                            name: path.basename(file),
                                            path: file,
                                            ctime: stat.ctime
                                        };
                                        cb(null, bucket);
                                    }
                                    else {
                                        cb(null, null);
                                    }
                                }
                            });
                        };
                        handlers[file] = handler;
                    })(path.join(rv.root, files[i]));
                }
                async.parallel(handlers, function (error, buckets) {
                    if (error) {
                        self._logger.error('BucketController.prototype.list(), async.parallel() failed. ', 'Error: ', error);
                        callback(errors.InternalError, null, null, null);
                    }
                    else {
                        // convert the result into xml and sent back
                        var body = {
                            owner: {
                                id: rv.global.owner.id,
                                displayName: rv.global.owner.name
                            },
                            buckets: {
                                bucket: []
                            }
                        };
                        for (var bucketName in buckets) {
                            if (buckets[bucketName]) {
                                body.buckets.bucket.push({
                                    name: buckets[bucketName].name,
                                    creationDate: buckets[bucketName].ctime.toUTCString()
                                });
                            }
                        }
                        callback(null, body, 'ListAllMyBucketsResult', null);
                    }
                });
            }
        });
        
    };

    module.exports = BucketController;

})();