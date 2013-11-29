(function () {
    'use strict';

    var http = require('http');
    var express = require('express');
    var argv = require('optimist').usage('Usage: $0 --host')
                                  .default('host', 'emu.aliyuncs.com')
                                  .default('path', './')
                                  .default('debug', false)
                                  .argv;

    var proxy = require('./dnsproxy.js');

    var app = express();

    // health check
    app.get('/ping', function (req, res) {
        console.log(req.headers.host);
        console.log(req.query);

        res.send(200, 'pong');
    });

    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('+ Aliyun OSS Emulator ');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    // start dns proxy
    var opt = {
        addresses: {
            argv.host: '127.0.0.1'
        },
        cache: true
    };
    proxy.createServer(opt).start();
    console.log('+ DNS proxy had been started. All request to *.emu.aliyuncs.com will be redirected to 127.0.0.1');
    console.log('+ Make sure the system DNS server had been changed to 127.0.0.1');

    // start emulator
    http.createServer(app).listen(80);
    console.log('+ Aliyun OSS emulator started and listen on 80 port.');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

})();