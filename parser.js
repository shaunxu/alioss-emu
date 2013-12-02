(function () {
    'use strict';

    var uuid = require('uuid');

    var Parser = function (name, logger) {
        var self = this;

        self._name = name;
        self._logger = logger;
    };

    Parser.prototype.parse = function (req) {
        return {
            requestId: uuid.v4(),
            bucketName: null,
            objectName: null,
            method: req.method,
            headers: req.headers,
            params: req.query
        };
    };

    module.exports = Parser;

})();