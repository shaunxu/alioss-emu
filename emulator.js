(function () {
    'use strict';
    
    var http = require('http');
    var express = require('express');
    var data2xml = require('data2xml')({ 'undefined': 'empty', 'null': 'empty' });
    var _ = require('underscore');

    var utils = require('./utils.js');

    var Emulator = function (logger, options) {
        var self = this;

        self._app = express();
        self._logger = logger;
        self._options = options;

        self._parser = new (require('./parser-' + options.mode + '.js'))(logger);
        self._router = new (require('./router.js'))(logger, options.auth);
    };

    Emulator.prototype._response = function (res, statusCode, body, requestId, headers, contentType, contentLength) {
        var self = this;

        var h = headers || {
            'Server': 'AliyunOSS'
        };
        if (!h['x-oss-request-id']) {
            h['x-oss-request-id'] = requestId;
        }
        if (!h['Date']) {
            h['Date'] = new Date().toUTCString();
        }
        if (!h['Content-Length']) {
            h['Content-Length'] = contentLength ? contentLength : (body ? (body.length ? body.length : 0) : 0);
        }
        if (!h['Content-Type'] && contentType) {
            h['Content-Type'] = contentType;
        }
        if (!h['Connection']) {
            h['Connection'] = 'close';
        }

        self._logger.debug('RES: Status Code: ' + statusCode + ', Body: ', body,  'Headers: ', h);
        res.set(h);
        res.send(statusCode, body);
    };

    Emulator.prototype._responseXml = function (res, root, xml, headers, requestId, statusCode) {
        var self = this;

        xml._attr = {
            xmlns: 'http://doc.oss.aliyuncs.com'
        };
        xml = utils.capsKeys(xml);
        var body = data2xml(root, xml);
        self._response(res, statusCode || 200, body, requestId, headers, 'application/xml');
    };

    Emulator.prototype._responseError = function (res, error, requestId) {
        var self = this;

        var xml = {
            '_attr': {
                xmlns: 'http://doc.oss.aliyuncs.com'
            },
            'Code': error.code,
            'Message': error.message,
            'RequestId': requestId,
            'HostId': self._options.host
        };
        var body = data2xml('Error', xml);
        self._response(res, error.statusCode, body, requestId, null, 'text/xml; charset=UTF-8');
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
                            // pass the app level options into route value
                            rv.global = self._options;
                            // perform the action from controller with arguments (req, rv, callback)
                            action.call(controller, req, rv, function (error, body, root, headers, statusCode) {
                                if (error) {
                                    self._responseError(res, error, rv.requestId);
                                }
                                else {
                                    if (root) {
                                        // root was specified which means this is an xml response
                                        self._responseXml(res, root, body, headers, rv.requestId, statusCode);
                                    }
                                    else {
                                        // no root specified so the body should be null or stream
                                        self._response(res, statusCode || 200, body, rv.requestId, headers);
                                    }
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