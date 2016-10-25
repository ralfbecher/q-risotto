'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const config = require('./config')
const path = require('path')
const fs = require('fs');
const routes = require('./routes');

const tls = {
    ca: [fs.readFileSync(config.certificates.root)],
    key: fs.readFileSync(config.certificates.server_key),
    cert: fs.readFileSync(config.certificates.server)
};

const server = new Hapi.Server();

server.register(Inert, (err) => {
    if (err) {
        throw err;
    }
});

server.connection({
    port: config.port,
    tls: tls
});

server.route(routes.routes);

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});