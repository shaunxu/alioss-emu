(function () {
    'use strict';

    var fs = require('fs');

    // IMPORTANT 
    // each function under this class must has arguments (req, rv, callback)
    // which callback is (error, body, mode { 'xml', 'data' }, headers)

    var Controller = function (name, logger) {
        var self = this;

        self._name = name;
        self._logger = logger;
    };

    Controller.prototype.defaultHeaders = function (rv, body, contentLength, contentType, etag) {
        var self = this;

        // calculate the content length from body if not specified
        if (!contentLength) {
            contentLength = (body && body.length) ? body.length : 0;
        }
        var headers = {
            'x-oss-request-id': rv.requestId,
            'Date': new Date().toUTCString(),
            'Content-Length': contentLength,
            'Connection': 'close',
            'Server': 'AliyunOSS'
        };
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        if (etag) {
            headers['ETag'] = etag;
        }
        return headers;
    };

    // @param path {string} - the bucket or object path, NOT the meta path
    // @param meta {object} - metadata
    // @param callback {function} - fn (error)
    Controller.prototype.setMeta = function (path, meta, callback) {
        var self = this;

        var metaPath = path + '.meta';
        if (meta) {
            // create or update meta file
            var data = JSON.stringify(meta, null, 2);
            fs.writeFile(metaPath, data, function (error) {
                if (error) {
                    self._logger.error('Controller.prototype.saveMeta(), create meta failed. ', 'metaPath: ', metaPath, ', Error: ', error);
                    callback(errors.InternalError);
                }
                else {
                    callback(null);
                }
            })
        }
        else {
            // delete meta file
            fs.exists(metaPath, function (exists) {
                if (exists) {
                    fs.unlink(metaPath, function (error) {
                        if (error) {
                            self._logger.error('Controller.prototype.setMeta(), delete meta failed. ', 'metaPath: ', metaPath, ', Error: ', error);
                            callback(errors.InternalError);
                        }
                        else {
                            callback(null);
                        }
                    });
                }
                else {
                    callback(null);
                }
            });
        }
    };

    // @param path {string} - the bucket or object path, NOT the meta path
    // @param callback {function} - fn (error, meta)
    Controller.prototype.getMeta = function (path, callback) {
        var self = this;

        var metaPath = path + '.meta';
        // check if the meta file exists
        self.exists(metaPath, false, function (error, exists) {
            if (error) {
                self._logger.error('Controller.prototype.getMeta(), check meta file exists failed, metaPath: ', metaPath, ', Error: ', error);
                callback(error, null);
            }
            else if (exists) {
                fs.readFile(metaPath, { encoding: 'utf8' }, function (error, data) {
                    if (error) {
                        self._logger.error('Controller.prototype.getMeta(), read meta file failed, metaPath: ', metaPath, ', Error: ', error);
                        callback(error, null);
                    }
                    else {
                        try {
                            var meta = JSON.parse(data);
                            callback(null, meta);
                        }
                        catch (e) {
                            self._logger.error('Controller.prototype.getMeta(), parse meta file failed, metaPath: ', metaPath, ', Error: ', e);
                            callback(error, null);
                        }
                    }
                });
            }
            else {
                callback(null, {});
            }
        });
    };

    // @param callback {function} - fn (error, exists)
    Controller.prototype.exists = function (path, shouldBeDirectory, callback) {
        var self = this;

        fs.exists(path, function (exists) {
            if (exists) {
                fs.stat(path, function (error, stats) {
                    if (error) {
                        self._logger.error('Controller.prototype.exists(), fs.stat() failed, path: ', path, ', Error: ', error);
                        callback(error, null);
                    }
                    else {
                        var result = shouldBeDirectory ? stats.isDirectory() : stats.isFile();
                        callback(null, result);
                    }
                });
            }
            else {
                callback(null, false);
            }
        });
    };

    module.exports = Controller;

})();