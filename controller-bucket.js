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
                callback(null, null, null, headers, null);
            }
            else {
                // create a folder for this bucket with relevant meta
                fs.mkdir(bucketPath, function (error) {
                    if (error) {
                        self._logger.error('BucketController.prototype.put(), create bucket folder failed. ', 'bucketPath: ', bucketPath, ', Error: ', error);
                        callback(errors.InternalError, null, null, null, null);
                    }
                    else {
                        var meta = { 'acl': 'private' };
                        self.setMeta(bucketPath, meta, function (error) {
                            if (error) {
                                callback(error, null, null, null, null);
                            }
                            else {
                                callback(null, null, null, headers, null);
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
                callback(errors.InternalError, null, null, null, null);
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
                        callback(errors.InternalError, null, null, null, null);
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
                        callback(null, body, 'ListAllMyBucketsResult', null, null);
                    }
                });
            }
        });
        
    };

    BucketController.prototype.delete = function (req, rv, callback) {
        var self = this;

        var bucketPath = self._getBucketPath(rv);
        // check if the bucket exists
        fs.exists(bucketPath, function (exists) {
            if (exists) {
                // the bucket must be a folder
                fs.stat(bucketPath, function (error, stat) {
                    if (error) {
                        self._logger.error('BucketController.prototype.delete(), fs.stat() failed. ', 'Bucket Path:', bucketPath, 'Error: ', error);
                        callback(errors.InternalError, null, null, null, null);
                    }
                    else {
                        if (stat.isDirectory()) {
                            // make sure there's no content in this bucket (folder)
                            fs.readdir(bucketPath, function (error, files) {
                                if (error) {
                                    self._logger.error('BucketController.prototype.delete(), fs.readdir() failed. ', 'Bucket Path:', bucketPath, 'Error: ', error);
                                    callback(errors.InternalError, null, null, null, null);
                                }
                                else {
                                    if (files && files.length && files.length > 0) {
                                        // buckets has content, 409 error
                                        callback(errors.BucketNotEmpty, null, null, null, null);
                                    }
                                    else {
                                        // delete the bucket and its related meta file if exists
                                        fs.rmdir(bucketPath, function (error) {
                                            if (error) {
                                                self._logger.error('BucketController.prototype.delete(), fs.unlink() failed. ', 'Bucket Path:', bucketPath, 'Error: ', error);
                                                callback(errors.InternalError, null, null, null, null);
                                            }
                                            else {
                                                self.setMeta(bucketPath, null, function (error) {
                                                    if (error) {
                                                        self._logger.error('BucketController.prototype.delete(), self.setMeta() failed. ', 'Bucket Path:', bucketPath, 'Error: ', error);
                                                        callback(errors.InternalError, null, null, null, null);
                                                    }
                                                    else {
                                                        callback(null, null, null, null, 204);
                                                    }
                                                });
                                            }
                                        })
                                    }
                                }
                            });
                        }
                        else {
                            // bucket path is a file not a folder
                            callback(errors.NoSuchBucket, null, null, null, null);
                        }
                    }
                });

            }
            else {
                // bucket does not exists return 404 error
                callback(errors.NoSuchBucket, null, null, null, null);
            }
        });
    };

    module.exports = BucketController;

})();