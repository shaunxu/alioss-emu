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
    Controller.prototype.saveMeta = function (path, meta, callback) {
        var metaPath = path + '.meta';
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
    };

    module.exports = Controller;

})();