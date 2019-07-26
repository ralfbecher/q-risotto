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
const port = process.env.PORT || config.port;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

server.register(Inert, (err) => {
    if (err) {
        throw err;
    }
});

if (config.certificatesPath) {
    server.connection({
        port: port,
        tls: {
            ca: [config.certificates.ca],
            key: config.certificates.server.key,
            cert: config.certificates.server.cert
        }
    });
} else {
    server.connection({
        port: config.port
    });
}
console.log('q-risotto is running on port ' + port);

server.route(routes.routes);

server.start((err) => {
    if (err) {
        throw err;
    }
    logger.info('Server running at:', server.info.uri);
});
