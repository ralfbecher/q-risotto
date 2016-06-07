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
        path: '/',
        handler: function (request, reply) {
            var _qtproduct = '',
                _global = {};
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.qTProduct();
            }).then(function (prod) {
                _qtproduct = prod;
                return _global.productVersion();
            }).then(function (vers) {
                _global.connection.ws.terminate();
                reply({
                    name: pjson.name,
                    version: pjson.version,
                    description: pjson.description,
                    author: pjson.author,
                    license: pjson.license,
                    qtProduct: _qtproduct,
                    qtVersion: vers,
                    state: 'cooking'
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs',
        handler: function (request, reply) {
            var _global = {};
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.getDocList();
            }).then(function (list) {
                _global.connection.ws.terminate();
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
            var _global = {};
            console.log("doc", request.params.docId);
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getAppLayout();
            }).then(function (layout) {
                _global.connection.ws.terminate();
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
            var _global = {};
            console.log("doc", request.params.docId);
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getAllInfos();
            }).then(function (infos) {
                _global.connection.ws.terminate();
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
            var _global = {};
            console.log("doc", request.params.docId, "object", request.params.objId);
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getObject(request.params.objId);
            }).then(function (object) {
                if (object) {
                    return object.getProperties();
                } else {
                    _global.connection.ws.terminate();
                    reply({});
                }
            }).then(function (props) {
                _global.connection.ws.terminate();
                reply({
                    qProp: props
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}/objects/{objId}/data',
        handler: function (request, reply) {
            var _global = {};
            console.log("doc", request.params.docId, "object", request.params.objId, "data");
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getObject(request.params.objId);
            }).then(function (object) {
                return object.getLayout().then(function (layout) {
                    if (layout.hasOwnProperty('qHyperCube')) {
                        return layout.qHyperCube.qDataPages;
                    } else if (layout.hasOwnProperty('qListObject')) {
                        return object.getListObjectData("/qListObjectDef", [{
                            "qTop": 0,
                            "qLeft": 0,
                            "qWidth": layout.qListObject.qSize.qcx,
                            "qHeight": layout.qListObject.qSize.qcy
                        }]);
                    } else {
                        _global.connection.ws.terminate();
                        reply({});
                    }
                })
            }).then(function (data) {
                _global.connection.ws.terminate();
                reply({
                    qDataPages: data
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}/objects/{objId}/pivotdata',
        handler: function (request, reply) {
            var _global = {};
            console.log("doc", request.params.docId, "object", request.params.objId, "pivotdata");
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getObject(request.params.objId);
            }).then(function (object) {
                return object.getLayout().then(function (layout) {
                    if (layout.hasOwnProperty('qHyperCube')) {
                        if (layout.qHyperCube.hasOwnProperty('qPivotDataPages')) {
                            return layout.qHyperCube.qPivotDataPages;
                        } else {
                            return [];
                        }
                    } else {
                        return [];
                    }
                })
            }).then(function (data) {
                _global.connection.ws.terminate();
                reply({
                    qPivotDataPages: data
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}/objects/{objId}/layers',
        handler: function (request, reply) {
            var _global = {};
            console.log("doc", request.params.docId, "object", request.params.objId, "layers");
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getObject(request.params.objId);
            }).then(function (object) {
                return object.getLayout().then(function (layout) {
                    if (layout.hasOwnProperty('layers')) {
                        return layout.layers;
                    } else {
                        return [];
                    }
                })
            }).then(function (layers) {
                _global.connection.ws.terminate();
                reply({
                    layers: layers
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/docs/{docId}/objects/{objId}/layout',
        handler: function (request, reply) {
            var _global = {};
            console.log("doc", request.params.docId, "object", request.params.objId, "layout");
            qsocks.Connect(engineconfig).then(function (global) {
                _global = global;
                return global.openDoc(request.params.docId);
            }).then(function (doc) {
                return doc.getObject(request.params.objId);
            }).then(function (object) {
                return object.getLayout();
            }).then(function (layout) {
                _global.connection.ws.terminate();
                reply({
                    qLayout: layout
                });
            });
        }
    }
];