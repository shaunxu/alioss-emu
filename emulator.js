(function () {
    'use strict';
    
    var http = require('http');
    var express = require('express');

    var Emulator = function (logger, options) {
        var self = this;

        self._app = express();
        self._logger = logger;
        self._options = options;
        self._parser = new (require('./parser-' + options.mode + '.js'))(logger);
    };

    Emulator.prototype._response = function (res, statusCode, body, headers) {
        var self = this;

        self._logger.debug('RES: Status Code: ' + statusCode + ', Body: ' + (body ? body.toString() : '(unknown)') + ', Headers: \n' + self._logger.convertToString(headers));
        res.set(headers);
        res.send(statusCode, body);
    };

    Emulator.prototype.start = function () {
        var self = this;

        self._app.use(function (req, res, next) {
            // never timeout
            res.setTimeout(0);
            // log the request with the unique request id
            self._logger.debug('REQ: Method: ' + req.method + ', Url: ' + req.url + ', Headers: \n' + self._logger.convertToString(req.headers));
            // parse the request to get the operation information
            var opt = self._parser.parse(req);
            self._logger.debug('Operation options:', opt);
            next();
        });

        // health check
        self._app.get('/ping', function (req, res) {
            self._response(res, 200, 'pong');
        });

        // start emulator
        http.createServer(self._app)
            .listen(self._options.port);
        self._logger.info('Addr: http://' + self._options.host + ':' + self._options.port + '/');
        self._logger.info('Path: ' + self._options.root);
        self._logger.info('Mode: ' + self._options.mode);
    };

    module.exports = Emulator;

})();