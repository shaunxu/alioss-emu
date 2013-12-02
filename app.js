(function () {
    'use strict';

    var path = require('path');
    var argv = require('optimist').usage('Usage: $0 --host [oss.aliyuncs.com] --port [80] --path [oss] --mode [default|query] --debug')
                                  .default('host', 'oss.aliyuncs.com')
                                  .default('port', '80')
                                  .default('path', 'oss')
                                  .default('mode', 'default')
                                  .default('debug', false)
                                  .argv;
    var logger = require('./logger.js')(argv.debug === true ? 'debug' : 'info');

    logger.info('Aliyun OSS Emulator');
    // establish dns proxt based on the command-line argument `mode`
    if (argv.mode == 'default') {
        var proxy = require('./dnsproxy.js');
        var opt = {};
        opt.addresses = {};
        opt.addresses[argv.host] = '127.0.0.1';
        opt.cache = true;
        proxy.createServer(opt).start();

        // start dns proxy
        logger.info('DNS proxy had been started. All request to *.emu.aliyuncs.com will be redirected to 127.0.0.1');
        logger.info('Make sure the system DNS server had been changed to 127.0.0.1');
    }

    // start the emulator
    var root = path.join(process.cwd(), argv.path);
    var emulator = new (require('./emulator.js'))(
        logger, 
        {
            host: argv.host,
            port: argv.port,
            root: root,
            mode: argv.mode
        });
    emulator.start();


})();