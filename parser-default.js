(function () {
    'use strict';

    var util = require('util');
    var _ = require('underscore');
    var Parser = require('./parser.js');

    var DefaultParser = function (logger) {
        Parser.call(this, 'default', logger);
    };
    util.inherits(DefaultParser, Parser);

    DefaultParser.prototype.parse = function (req) {
        // invoke the base method to fill the headers and params
        var opt = Parser.prototype.parse.call(this, req);
        // retrieve the bucket name and object name, if applicable, from the url
        var hosts = req.headers.host.split('.');
        if (hosts.length > 0) {
            opt.bucketName = hosts[0];
        }
        var elements = _.compact(req.path.split('/'));
        if (elements.length > 0) {
            opt.objectName = elements[0];
        }
        return opt;
    };

    module.exports = DefaultParser;

})();