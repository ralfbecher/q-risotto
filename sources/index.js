'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const path = require('path')
const fs = require('fs');
const routes = require('./routes');
const config = require('./src/config/config')

const server = new Hapi.Server();

server.register(Inert, (err) => {
    if (err) {
        throw err;
    }
});

server.connection({
    port: config.port,
    tls: {
        ca: [config.certificates.ca],
        key: config.certificates.key,
        cert: config.certificates.cert
    }
});

server.route(routes.routes);

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
