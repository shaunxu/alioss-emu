(function () {
    'use strict';

    var OssError = function (statusCode, code, message, opt) {
        var self = this;

        self._statusCode = statusCode;
        self._code = code;
        self._message = message;
        self._requestId = opt.requestId;
        self._hostId = opt.headers.host;
    };

    OssError.prototype.statusCode = function () {
        var self = this;
        return self._statusCode;
    };

    OssError.prototype.toObject = function () {
        var self = this;
        return {
            code: self._code,
            message: self._message,
            requestId: self._requestId,
            hostId: self._hostId
        };
    };

    module.exports = OssError;

})();