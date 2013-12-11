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

    ObjectController.prototype._getValueFromHeaderOrQuery = function (rv, key, ignoreCase) {
        var self = this;

        var value = null;
        // try get the value from headers
        if (ignoreCase) {
            value = utils.getOwnPropertyIgnoreCase(rv.headers, key);
        }
        else {
            value = rv.headers[key];
        }
        // try get the value from query if it's not defined in headers
        if (!value) {
            if (ignoreCase) {
                value = utils.getOwnPropertyIgnoreCase(rv.params, key);
            }
            else {
                value = rv.params[key];
            }
        }
        return value;
    };

    ObjectController.prototype._getRange = function (rv) {
        var self = this;

        var range = null;
        var value = self._getValueFromHeaderOrQuery(rv, 'Range');
        if (value) {
            var kvp = value.split('=');
            if (kvp.length > 1 && kvp[0] == 'bytes=') {
                var rs = kvp[1].split('-');
                if (rs.length > 1) {
                    range = {
                        s: rs[0],
                        e: rs[1]
                    };
                }
            }
        }
        return range;
    };

    ObjectController.prototype._mergeProperty = function (source, target, key, overwrite) {
        var self = this;

        overwrite = overwrite || false;
        var srouceValue = utils.getOwnPropertyIgnoreCase(source, key);
        var targetValue = utils.getOwnPropertyIgnoreCase(target, key);
        if (srouceValue) {
            if (overwrite || !targetValue) {
                target[key] = srouceValue;
            }
        }
    };

    ObjectController.prototype._calculateResponseHeaders = function (objectPath, rv, callback) {
        var self = this;

        var headers = {};
        // retrieve the file size and last modified, then save into headers
        fs.stat(objectPath, function (error, stats) {
            if (error) {
                self._logger.error('ObjectController.prototype._calculateResponseHeaders(), fs.stat() failed, objectPath: ', objectPath, ', Error: ', error);
                callback(error, null);
            }
            else {
                headers['Content-Length'] = stats.size;
                headers['Last-Modified'] = stats.mtime.toUTCString();
                // calculate etag from the file and save into headers
                self._calculateETag(objectPath, function (error, etag) {
                    if (error) {
                        callback(errors.InternalError, null, null, null, null);
                    }
                    else {
                        headers['ETag'] = etag;
                        // retrieve headers from meta and push into the headers for those not populated
                        self.getMeta(objectPath, function (error, meta) {
                            if (error) {
                                callback(errors.InternalError, null, null, null, null);
                            }
                            else {
                                self._mergeProperty(meta, headers, 'Cache-Control', true);
                                self._mergeProperty(meta, headers, 'Content-Disposition', true);
                                self._mergeProperty(meta, headers, 'Content-Encoding', true);
                                self._mergeProperty(meta, headers, 'Content-Type', true);
                                self._mergeProperty(meta, headers, 'Expires', true);
                                // retrieve the expected response headers from request (those starts with `response-` headers)
                                var expectedHeaders = {
                                    'Cache-Control': self._getValueFromHeaderOrQuery(rv, 'response-cache-control', true),
                                    'Content-Disposition': self._getValueFromHeaderOrQuery(rv, 'response-content-disposition', true),
                                    'Content-Encoding': self._getValueFromHeaderOrQuery(rv, 'response-content-encoding', true),
                                    'Content-Type': self._getValueFromHeaderOrQuery(rv, 'response-content-type', true),
                                    'Content-Language': self._getValueFromHeaderOrQuery(rv, 'response-content-language', true),
                                    'Expires': self._getValueFromHeaderOrQuery(rv, 'response-expires', true)
                                };
                                self._mergeProperty(expectedHeaders, headers, 'Cache-Control', true);
                                self._mergeProperty(expectedHeaders, headers, 'Content-Disposition', true);
                                self._mergeProperty(expectedHeaders, headers, 'Content-Encoding', true);
                                self._mergeProperty(expectedHeaders, headers, 'Content-Type', true);
                                self._mergeProperty(expectedHeaders, headers, 'Content-Language', true);
                                self._mergeProperty(expectedHeaders, headers, 'Expires', true);
                                callback(null, headers);
                            }
                        });
                    }
                });

            }
        });
    };

    ObjectController.prototype.get = function (req, rv, callback) {
        var self = this;

        var objectPath = self._getObjectPath(rv);
        var bucketPath = path.dirname(objectPath);

        // check if the object exists
        self.exists(objectPath, false, function (error, exists) {
            if (error) {
                callback(errors.InternalError, null, null, null, null);
            }
            else {
                if (exists) {
                    self._calculateResponseHeaders(objectPath, rv, function (error, headers) {
                        if (error) {
                            callback(errors.InternalError, null, null, null, null);
                        }
                        else {
                            // open the object file and pipe its content into body
                            fs.readFile(objectPath, function (error, data) {
                                if (error) {
                                    self._logger.error('ObjectController.prototype.get(), fs.readFile() failed, objectPath: ', objectPath, ', Error: ', error);
                                    callback(errors.InternalError, null, null, null, null);
                                }
                                else {
                                    callback(null, data, null, headers, null);
                                }
                            });
                        }
                    });
                }
                else {
                    callback(errors.NoSuchKey, null, null, null, null);
                }
            }
        });
    };

    module.exports = ObjectController;

})();