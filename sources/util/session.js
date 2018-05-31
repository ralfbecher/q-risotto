'use strict';

const enigma = require('enigma.js');
const WebSocket = require('ws');
const config = require('../src/config/config');

const schema = require(config.enigmaSchema);

module.exports = (appId) => {
  if (!appId || appId === '') {
    appId = config.globalAppId;
  }
  return enigma.create({
    schema,
    url: `wss://${config.engineHost}:${config.enginePort}/app/${appId}`,
    createSocket: url => new WebSocket(url, {
      ca: [config.certificates.ca],
      key: config.certificates.key,
      cert: config.certificates.cert,
      headers: {
        'X-Qlik-User': `UserDirectory=${encodeURIComponent(config.userDirectory)}; UserId=${encodeURIComponent(config.userId)}`,
      }
    })
  });
}
