(function () {
    'use strict';

    var path = require('path');
    var argv = require('optimist').default('host', 'oss.aliyuncs.com')
                                  .default('port', '80')
                                  .default('path', 'oss')
                                  .default('mode', 'default')
                                  .default('auth', false)
                                  .default('key', '44CF9590006BF252F707')
                                  .default('secret', 'OtxrzxIsfpFjA7SwPzILwy8Bw21TLhquhboDYROV')
                                  .default('owner-id', '00220120222')
                                  .default('owner-displayname', 'oss_emu')
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
    console.log(argv.auth);
    var root = path.join(process.cwd(), argv.path);
    var options = {
        host: argv.host,
        port: argv.port,
        root: root,
        mode: argv.mode,
        auth: {
            enabled: argv.auth,
            key: argv.key,
            secret: argv.secret
        },
        owner: {
            id: argv['owner-id'],
            name: argv['owner-displayname']
        }
    };

    logger.info('Emulator started with options: ', options);
    var emulator = new (require('./emulator.js'))(logger, options);
    emulator.start();

})();