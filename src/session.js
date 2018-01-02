'use strict';

const enigma = require('enigma.js');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const schema = require(config.enigmaSchema);

module.exports = () => enigma.create({
  schema,
  url: `wss://${config.engineHost}:${config.enginePort}/app/${config.appId}`,
  createSocket: url => new WebSocket(url, {
    ca: [config.certificates.ca],
    key: config.certificates.key,
    cert: config.certificates.cert,
    headers: {
      'X-Qlik-User': `UserDirectory=${encodeURIComponent(config.userDirectory)}; UserId=${encodeURIComponent(config.userId)}`,
    },
  }),
});
