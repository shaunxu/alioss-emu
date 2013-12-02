(function () {
    'use strict';

    var util = require('util');
    var _ = require('underscore');
    var Parser = require('./parser.js');

    var QueryParser = function (logger) {
        Parser.call(this, 'query', logger);
    };
    util.inherits(QueryParser, Parser);

    QueryParser.prototype.parse = function (req) {
        // invoke the base method to fill the headers and params
        var opt = Parser.prototype.parse.call(this, req);
        // retrieve the bucket name and object name, if applicable, from the url
        var elements = _.compact(req.path.split('/'));
        if (elements.length > 0) {
            opt.bucketName = elements[0];
        }
        if (elements.length > 1) {
            opt.objectName = elements[1];
        }
        return opt;
    };

    module.exports = QueryParser;

})();