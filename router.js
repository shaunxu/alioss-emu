(function () {
    'use strict';

    var utils = require('./utils.js');
    var errors = require('./errors.js');

    // @param options {object} - { auth: { enabled, key, secret } }
    var Router = function (logger, options) {
        var self = this;

        self._logger = logger;
        self._options = options;
        self._controllers = {};
    };

    // @param callback { function } - fn (error, controller, action)
    Router.prototype._route = function (controllerName, actionName, callback) {
        var self = this;
        // retrieve the controller instance with cache enabled
        var controller = self._controllers[controllerName];
        if (!controller) {
            controller = new (require('./controller-' + controllerName + '.js'))(self._logger);
            controller[controllerName] = controller;
        }
        // invoke the action from the controller instance to perform the operation
        var action  = controller[actionName];
        if (action) {
            callback(null, controller, action);
        }
        else {
            callback(errors.MethodNotAllowed, null, null);
        }
    };

    // @param rv {object} - route values which is the same object from parser.parse()
    // @param callback {function} - fn (error, controller, action)
    Router.prototype.route = function (rv, callback) {
        var self = this;
        var routed = false;

        // // Get Service (List Bucket)
        // if (routed === false && utils.isNullOrEmpty(rv.bucketName) && 
        //     rv.method == 'GET') {
        //     self._logger.debug('Routed to operation: bucket.list');
        //     routed = true;
        // }

        // Put Bucket
        if (routed === false && 
            !utils.isNullOrEmpty(rv.bucketName) && 
            utils.isNullOrEmpty(rv.objectName) && 
            rv.method == 'PUT') {
            self._logger.debug('Routed to operation: bucket.put');
            routed = true;
            utils.authenticate(self._options, rv.authorization, rv.method, rv.headers, function (error) {
                if (error) {
                    callback(error, null);
                }
                else {
                    self._route('bucket', 'put', callback);
                }
            });

        }

        // finally
        if (routed === false) {
            callback(errors.NotImplemented, null, null);
        }
    };

    module.exports = Router;

})();