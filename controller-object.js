(function () {
    'use strict';

    var util = require('util');
    var fs = require('fs');
    var crypto = require('crypto');
    var path = require('path');
    var async = require('async');

    var errors = require('./errors.js');
    var utils = require('./utils.js');
    var Controller = require('./controller.js');

    var ObjectController = function (logger) {
        Controller.call(this, 'Object', logger);
    };
    util.inherits(ObjectController, Controller);

    ObjectController.prototype._getObjectPath = function (rv) {
        var encoded = encodeURI(rv.objectName);
        return path.join(rv.root, rv.bucketName, encoded);
    };

    ObjectController.prototype._calculateETag = function (objectPath, callback) {
        var self = this;

        var md5 = crypto.createHash('md5');
        var stream = fs.ReadStream(objectPath);
        stream.on('data', function (data) {
            md5.update(data);
        });
        stream.on('error', function (error) {
            self._logger.error('ObjectController.prototype._calculateETag(), read file failed. objectPath: ', objectPath, ', Error: ', error);
            callback(error, null);
        });
        stream.on('end', function () {
            var digest = md5.digest('hex');
            callback(null, digest);
        });
    };

    ObjectController.prototype.put = function (req, rv, callback) {
        var self = this;

        var objectPath = self._getObjectPath(rv);
        var bucketPath = path.dirname(objectPath);
        var meta = {
            'Cache-Control': utils.getOwnPropertyIgnoreCase(rv.headers, 'Cache-Control'),
            'Content-Disposition': utils.getOwnPropertyIgnoreCase(rv.headers, 'Content-Disposition'),
            'Content-Encoding': utils.getOwnPropertyIgnoreCase(rv.headers, 'Content-Encoding'),
            'Content-Type': utils.getOwnPropertyIgnoreCase(rv.headers, 'Content-Type'),
            'Expires': utils.getOwnPropertyIgnoreCase(rv.headers, 'Expires'),
            'x-oss-server-side-encryption': utils.getOwnPropertyIgnoreCase(rv.headers, 'x-oss-server-side-encryption')
        };
        // copy all headers starts with `x-oss-meta-` into meta object
        for (var key in rv.headers) {
            if (utils.startsWith(key, 'x-oss-meta-')) {
                meta[key] = rv.headers[key];
            }
        }
        // validation
        if (!utils.hasOwnPropertyIgnoreCase(rv.headers, 'Content-Length')) {
            callback(errors.MissingContentLength, null, null, null, null);
        }
        else if (meta['x-oss-server-side-encryption'] && meta['x-oss-server-side-encryption'] != 'AES256') {
            callback(errors.InvalidEncryptionAlgorithmError, null, null, null, null);
        }
        else {
            self.exists(bucketPath, true, function (error, exists) {
                if (error) {
                    callback(errors.InternalError, null, null, null, null);
                }
                else {
                    if (!exists) {
                        callback(errors.NoSuchBucket, null, null, null, null);
                    }
                    else {
                        // all right, let's save the file from request into file system
                        var stream = fs.createWriteStream(objectPath);
                        var _onError = function (error) {
                            self._logger.error('ObjectController.prototype.put(), save file failed. objectPath: ', objectPath, ', Error: ', error);
                            callback(errors.InternalError, null, null, null, null);
                        };
                        var _onEnd = function () {
                            console.log('md5');
                            // calculate etag (md5)
                            self._calculateETag(objectPath, function (error, etag) {
                                if (error) {
                                    callback(errors.InternalError, null, null, null, null);
                                }
                                else {
                                    meta['ETag'] = etag;
                                    // save associate meta file
                                    self.setMeta(objectPath, meta, function (error) {
                                        if (error) {
                                            callback(errors.InternalError, null, null, null, null);
                                        }
                                        else {
                                            // all done
                                            var headers = {
                                                'ETag': etag
                                            };
                                            callback(null, null, null, headers, null);
                                        }
                                    });
                                }
                            });
                        };
                        req.on('error', _onError)
                           .on('end', _onEnd);
                        req.pipe(stream);
                    }
                }
            })
        }
    };

    module.exports = ObjectController;

})();