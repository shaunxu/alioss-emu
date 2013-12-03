(function () {
    'use strict';
    
    var http = require('http');
    var express = require('express');
    var builder = require('xmlbuilder');

    var Emulator = function (logger, options) {
        var self = this;

        self._app = express();
        self._logger = logger;
        self._options = options;

        self._parser = new (require('./parser-' + options.mode + '.js'))(logger);
        self._router = new (require('./router.js'))(logger, options.auth);
    };

    Emulator.prototype._response = function (res, statusCode, body, headers) {
        var self = this;

        self._logger.debug('RES: Status Code: ' + statusCode + ', \nBody: \n' + (body ? body.toString() : '(unknown)') + '\nHeaders: \n' + self._logger.convertToString(headers));
        res.set(headers);
        res.send(statusCode, body);
    };

    Emulator.prototype._responseError = function (res, error, requestId) {
        var self = this;
        var xml = builder.create('Error', { xmlns: 'http://doc.oss.aliyuncs.com' });
        xml.ele('Code', null, error.code);
        xml.ele('Message', null, error.message);
        xml.ele('RequestId', null, requestId);
        xml.ele('HostId', null, self._options.host);
        var body = xml.end({ pretty: true });
        var headers = {
            'x-oss-request-id': requestId,
            'Date': new Date().toUTCString(),
            'Content-Length': body.length,
            'Content-Type': 'text/xml; charset=UTF-8',
            'Connection': 'close',
            'Server': 'AliyunOSS'
        };
        self._response(res, error.statusCode, body, headers);
    };

    Emulator.prototype.start = function () {
        var self = this;

        self._app.use(function (req, res, next) {
            // never timeout
            res.setTimeout(0);
            // log the request with the unique request id
            self._logger.debug('REQ: Method: ' + req.method + ', Url: ' + req.url + ', Headers: \n' + self._logger.convertToString(req.headers));
            // parse the request to get the operation information
            self._parser.parse(req, self._options.root, function (error, rv) {
                if (error) {
                    self._responseError(res, error, rv.requestId);
                }
                else {
                    self._logger.debug('Parse successfully, route value:', rv);
                    // route this request and retrieve the action function
                    self._router.route(rv, function (error, controller, action) {
                        if (error) {
                            self._responseError(res, error, rv.requestId);
                        }
                        else {
                            // perform the action from controller with arguments (req, rv, callback)
                            action.call(controller, req, rv, function (error, body, headers) {
                                if (error) {
                                    self._responseError(res, error, rv.requestId);
                                }
                                else {
                                    self._response(res, 200, body, headers);
                                }
                            });
                        }
                    });
                }
            });
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