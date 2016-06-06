const pjson = require('../package.json');
const config = require('../config');
const qsocks = require('qsocks');
const path = require('path');
const fs = require('fs');


const hostname = new Buffer(fs.readFileSync(path.resolve(config.hostfile)).toString(), 'base64').toString()


const engineconfig = {
    host: hostname,
    port: config.enginePort,
    isSecure: true,
    headers: {
        'X-Qlik-User': config.engineuser
    },
    key: fs.readFileSync(config.certificates.client_key),
    cert: fs.readFileSync(config.certificates.client),
    rejectUnauthorized: false
};

module.exports.routes = [
    {
        method: 'GET',
        path: '/v1',
        handler: function (request, reply) {
            reply({
                name: pjson.name,
                version: pjson.version,
                description: pjson.description,
                author: pjson.author,
                license: pjson.license
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs',
        handler: function (request, reply) {
            qsocks.Connect(engineconfig).then(function (global) {
                return global.getDocList();
            }).then(function (list) {
                reply({
                    qDocList: list
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}',
        handler: function (request, reply) {
            console.log("openDoc", request.params.docId);
            qsocks.Connect(engineconfig).then(function (global) {
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getAppLayout();
            }).then(function (layout) {
                reply({
                    qLayout: layout
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}/objects',
        handler: function (request, reply) {
            console.log("openDoc", request.params.docId);
            qsocks.Connect(engineconfig).then(function (global) {
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getAllInfos();
            }).then(function (infos) {
                reply({
                    qInfos: infos.qInfos
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}/objects/{objId}',
        handler: function (request, reply) {
            console.log("openDoc", request.params.docId, "getObject", request.params.objId);
            qsocks.Connect(engineconfig).then(function (global) {
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getObject(request.params.objId);
            }).then(function (object) {
                if (object) {
                    return object.getLayout();
                } else {
                    reply({});
                }
            }).then(function (layout) {
                reply({
                    qLayout: layout
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}/objects/{objId}/data',
        handler: function (request, reply) {
            console.log("openDoc", request.params.docId, "getObject", request.params.objId, "data");
            qsocks.Connect(engineconfig).then(function (global) {
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getObject(request.params.objId);
            }).then(function (object) {
                console.log(object);
                return object.getLayout().then(function (layout) {
                    console.log(layout);
                    if (layout.hasOwnProperty('qHyperCube')) {
                        return object.getHyperCubeData("/qHyperCubeDef", [{
                            "qTop": 0,
                            "qLeft": 0,
                            "qWidth": layout.qHyperCube.qSize.qcx,
                            "qHeight": layout.qHyperCube.qSize.qcy
                        }]);
                    } else if (layout.hasOwnProperty('qListObject')) {
                        return object.getListObjectData("/qListObjectDef", [{
                            "qTop": 0,
                            "qLeft": 0,
                            "qWidth": layout.qListObject.qSize.qcx,
                            "qHeight": layout.qListObject.qSize.qcy
                        }]);
                    } else {
                        reply({});
                    }
                })
            }).then(function (data) {
                reply({
                    qDataPages: data
                });
            });
        }
    }
];