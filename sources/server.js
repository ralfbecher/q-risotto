'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const path = require('path')
const fs = require('fs');
const routes = require('./routes');
const config = require('./src/config/config')
const log4js = require('log4js');
const logger = log4js.getLogger();

logger.info("q-risotto started");

const server = new Hapi.Server();

server.register(Inert, (err) => {
    if (err) {
        throw err;
    }
});

if (config.certificatesPath) {
    server.connection({
        port: config.port,
        tls: {
            ca: [config.certificates.ca],
            key: config.certificates.key,
            cert: config.certificates.cert
        }
    });
} else {
    server.connection({
        port: config.port
    });
}

server.route(routes.routes);

server.start((err) => {
    if (err) {
        throw err;
    }
    logger.info('Server running at:', server.info.uri);
});
