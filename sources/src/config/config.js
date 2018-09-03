'use strict';

const path = require('path');
const fs = require('fs');
var config = require('./config.json');
const log4jsConfig = require('./log4js.json');
const log4js = require('log4js');
const logger = log4js.getLogger();

const readCert = filename => fs.readFileSync(path.resolve(__dirname, config.certificatesPath, filename));

if (config.certificatesPath) {
    config.certificates = {
        ca: readCert('root.pem'),
        key: readCert('client_key.pem'),
        cert: readCert('client.pem')
    }    
}

log4js.configure(log4jsConfig);

logger.level = 'debug';

module.exports = config;