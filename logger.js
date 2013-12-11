(function () {
    'use strict';

    var util = require('util');
    var _ = require('underscore');
    var log4js = require('log4js');

    var _logger = log4js.getLogger(':');

    var _toString = function (value) {
        var result = '';
        if (_.isNull(value)) {
            result = '(null)';
        }
        else if (_.isUndefined(value)) {
            result = '(undefined)';
        }
        else if (_.isFunction(value)) {
            result = '(function)';
        }
        else if (value instanceof Buffer) {
            result = '<Buffer: ' + value.length + '>';
        }
        else if (_.isObject(value)) {
            result = util.inspect(value, { depth: 9 });
        }
        else {
            result = value.toString();
        }
        return result;
    };

    var _flatMessage = function (parameters) {
        // convert the arguments into array
        var args = Array.prototype.slice.call(parameters);
        // convert the arguments into string with new lines
        var messages = _.map(args, function (value, key, list) {
            if (key > 0) {
                // all following arguments will be logged in each line
                return '\n' + _toString(value);
            }
            else {
                // first argument will be logged in the same line with timestamp
                return value.toString();
            }
        });
        return messages.join('');
    }

    var logger = function (level) {
        log4js.clearAppenders();
        log4js.addAppender(log4js.appenders.console(log4js.layouts.basicLayout));
        _logger.setLevel(level.toUpperCase());

        return {
            level: level,

            convertToString: function (value) {
                return _toString(value);
            },

            debug: function () {
                _logger.debug(_flatMessage(arguments));
            },

            info: function () {
                _logger.info(_flatMessage(arguments));
            },

            error: function () {
                _logger.error(_flatMessage(arguments));
            },

            // name: the function name
            // parameters: MUST pass the `arguments` variant inside this function
            debugOnFunctionEntry: function (name, fn, parameters) {
                //retrieve arguments' name from the function content
                var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
                var content = fn.toString().replace(STRIP_COMMENTS, '');
                var result = content.slice(content.indexOf('(')+1, content.indexOf(')')).match(/([^\s,]+)/g);
                if (result === null) {
                    result = [];
                }
                // copy the parameters into an array
                var params = Array.prototype.slice.call(parameters);
                // match the parameter name and value
                var response = {};
                for (var i = 0; i < result.length; i++) {
                    var value = (i < params.length) ? params[i] : null;
                    response[result[i]] = value;
                }
                // log the result
                var messages = [];
                messages.push('Function [' + name + '] invoked with parameters ...');
                for (var key in response) {
                    messages.push(key + ': ' + _toString(response[key]));
                }
                _logger.debug(_flatMessage(messages));
            },

            // name: the name of the calling function the callback defined
            // parameters: MUST pass the `arguments` variant inside this function
            debugOnFunctionCallback: function (name, parameters) {
                this.debugOnFunctionEntry(name + '.callback', parameters);
            }
        };
    };
    
    module.exports = logger;
})();