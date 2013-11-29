(function () {
    'use strict';

    var proxy = require('dnsproxy');

    var opt = {
        addresses: {
            "emu.aliyuncs.com": "127.0.0.1"
        },
        cache: true
    };
    proxy.createServer(opt).start();

})();