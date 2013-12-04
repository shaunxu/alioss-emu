(function () {
    'use strict';

    var crypto = require('crypto');
    var utf8 = require('utf8');

    var errors = require('./errors.js');

    var isNullOrEmpty = function (value) {
        if (value === null) {
            return true;
        }
        if (value === undefined) {
            return true;
        }
        if (value.length && value.length > 0) {
            return false;
        }
        else {
            return true;
        }
    };

    var capsKeys = function (object) {
        var _capsKeys = function (_parent, _key, _value) {
            if (_key.toUpperCase() == 'ID') {
                _key = 'ID';
            }
            else {
                _key = _key.charAt(0).toUpperCase() + _key.substr(1);
            }
            if (_.isArray(_value)) {
                _parent[_key] = [];
                _value.forEach(function (__value) {
                    var __parent = {};
                    _parent[_key].push(__parent);
                    for (var ___key in __value) {
                        _capsKeys(__parent, ___key, __value[___key]);
                    }
                });
            }
            else if (_.isObject(_value)) {
                _parent[_key] = {};
                for (var __key in _value) {
                    _capsKeys(_parent[_key], __key, _value[__key]);
                }
            }
            else {
                _parent[_key] = _value;
            }
        };

        var result = {};
        for (var key in object) {
            _capsKeys(result, key, object[key]);
        }
        return result;
    };

    var getCanonicalizedOssHeaders = function (headers) {
        var tmp_headers = {};
        var canonicalized_oss_headers = '';

        for (var k in headers) {
            if (k.toLowerCase().indexOf('x-oss-', 0) === 0) {
                tmp_headers[k.toLowerCase()] = headers[k];
            }
        }

        if (tmp_headers != {}) {
            var x_header_list = [];
            for (var k in tmp_headers) {
                x_header_list.push(k);
            }
            x_header_list.sort();
            
            for (var k in x_header_list) {
                canonicalized_oss_headers += x_header_list[k] + ':' + tmp_headers[x_header_list[k]] + '\n';
            }
        }
        
        return canonicalized_oss_headers;
    };

    var sign = function (secret, method, headers, date) {
        date = (date || headers['Date']) || new Date().toUTCString();
        var content_md5 = headers['Content-Md5'] || '';
        var content_type = headers['Content-Type'] || '';
        var canonicalized_oss_headers = getCanonicalizedOssHeaders(headers);
        var canonicalized_resource = '';

        var hmac = crypto.createHmac('sha1', secret);
        var data = method + '\n' + content_md5 + '\n' + content_type + '\n' + date + '\n' + canonicalized_oss_headers + canonicalized_resource;
        hmac.update(utf8.encode(data));
        return hmac.digest('base64');
    };

    // @param opt {object} - authentication options from command-line arguments, { enabled, key, secret }
    // @param callback {function} - fn (error)
    var authenticate = function (opt, authentication, method, headers, callback) {
        if (opt.enabled) {
            if (authentication || authentication == '') {
                callback(errors['AccessDenied']);
            }
            else {
                var signature = sign(opt.secret, method, headers, null);
                var expected = 'OSS ' + opt.key + ':' + signature;
                if (expected === authentication) {
                    callback(null);
                }
                else {
                    callback(errors.SignatureDoesNotMatch);
                }                
            }
        }
        else {
            callback(null);
        }
    };

    module.exports.isNullOrEmpty = isNullOrEmpty;
    module.exports.authenticate = authenticate;

})();