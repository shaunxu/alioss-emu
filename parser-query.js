(function () {
    'use strict';

    var util = require('util');
    var _ = require('underscore');
    var Parser = require('./parser.js');

    var QueryParser = function (logger) {
        Parser.call(this, 'query', logger);
    };
    util.inherits(QueryParser, Parser);

    QueryParser.prototype.onParse = function (rv, req) {
        // retrieve the bucket name and object name, if applicable, from the url
        var elements = _.compact(req.path.split('/'));
        if (elements.length > 0) {
            rv.bucketName = elements[0];
        }
        if (elements.length > 1) {
            rv.objectName = elements[1];
        }
    };

    module.exports = QueryParser;

})();