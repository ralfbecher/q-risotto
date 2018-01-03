const pjson = require('../package.json');
const config = require('../config');
const path = require('path');
const fs = require('fs');
const createSession = require('../session');

// switch console.log output
var debug = true;

const catchSessionOpen = error => {
    console.error('Failed to open session and/or retrieve the app list:', error);
    process.exit(1);
}

const genericCatch = error => {
    session.close();
    console.error('Error occured:', error);
}

const dateFromQlikNumber = n => {
    // return: Date from QlikView number
    var d = new Date(Math.round((n - 25569) * 86400 * 1000));
    // since date was created in UTC shift it to the local timezone
    d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
    return d;
}

const nxPage = {
    "qTop": 0,
    "qLeft": 0,
    "qWidth": 0,
    "qHeight": 0
};

const fieldTypes = {
    discrete: "D",
    numeric: "N",
    timestamp: "T"
};

const measureTypes = {
    U: fieldTypes.discrete,
    A: fieldTypes.discrete,
    I: fieldTypes.numeric,
    R: fieldTypes.numeric,
    F: fieldTypes.numeric,
    M: fieldTypes.numeric,
    D: fieldTypes.timestamp,
    T: fieldTypes.timestamp,
    TS: fieldTypes.timestamp,
    IV: fieldTypes.discrete
};

const fieldTags = {
    date: "$date",
    timestamp: "$timestamp"
};

const typeRisotto = {
    qType: "q-risotto"
};

module.exports.routes = [
    {
        method: 'GET',
        path: '/',
        handler: (request, reply) => {
            var _qtproduct = '',
                _global = {};
            const session = createSession();
            session.open()
            .then(global => {
                _global = global;
                return global.qTProduct();
            })
            .catch(catchSessionOpen)
            .then(prod => {
                _qtproduct = prod;
                return _global.productVersion();
            })
            .then(vers => {
                session.close();
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
            })
            .catch(genericCatch);
        }
    },
    { // static file content (WDC)
        method: 'GET',
        path: '/{param*}',
        config: {
            auth: false
        },
        handler: {
            directory: {
                path: 'public',
                listing: true,
                index: 'index.html'
            }
        }
    },
    {
        method: 'GET',
        path: '/v1/docs',
        handler: (request, reply) => {
            var _global = {};
            const session = createSession();
            session.open()
            .then((global) => {
                _global = global;
                return global.getDocList();
            })
            .catch(catchSessionOpen)
            .then(list => {
                session.close();
                reply({
                    qDocList: list
                });
            })
            .catch(genericCatch);
        }
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}',
        handler: (request, reply) => {
            var _global = {};
            if (debug) console.log("doc", request.params.docId);
            const session = createSession();
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId, "", "", "", true);
            })
            .catch(catchSessionOpen)
            .then(doc => doc.getAppLayout())
            .then((layout) => {
                session.close();
                reply({
                    qLayout: layout
                });
            })
            .catch(genericCatch);
        }
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/objects',
        handler: (request, reply) => {
            if (debug) console.log("doc objects", request.params.docId);
            var _global = {};
            const session = createSession();
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId, "", "", "", true);
            })
            .catch(catchSessionOpen)
            .then(doc => doc.getAllInfos())
            .then(infos => {
                session.close();
                reply({
                    qInfos: infos.qInfos || infos
                });
            })
            .catch(genericCatch);
        }
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "object", request.params.objId);
            var _global = {};
            const session = createSession();
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId, "", "", "", true);
            })
            .catch(catchSessionOpen)
            .then(doc => doc.getObject(request.params.objId))
            .then(object => {
                if (object) {
                    return object.getProperties();
                } else {
                    session.close();
                    reply({});
                }
            })
            .then(props => {
                session.close();
                reply({
                    qProp: props
                });
            })
            .catch(genericCatch);
        }
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/layout',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "object", request.params.objId, "layout");
            var _global = {};
            const session = createSession();
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId);
            })
            .catch(catchSessionOpen)
            .then(doc => doc.getObject(request.params.objId))
            .then(object => object.getLayout())
            .then(layout => {
                session.close();
                reply({
                    qLayout: layout
                });
            })
            .catch(genericCatch);
        }
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/data',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "object", request.params.objId, "data");
            var _global = {};
            const session = createSession();
            var nxPageToGet = nxPage;
            var w = 1, h = 10000;
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId);
            })
            .catch(catchSessionOpen)
            .then(doc => doc.getObject(request.params.objId))
            .then(object =>
                object.getLayout()
                    .then(layout => {
                        // TODO: implement paging
                        if (layout.hasOwnProperty('qHyperCube')) {
                            w = layout.qHyperCube.qDimensionInfo.length + layout.qHyperCube.qMeasureInfo.length;
                            if (w > 1) {
                                h = Math.floor(10000 / w);
                            }        
                            nxPageToGet.qWidth = w;
                            nxPageToGet.qHeight = h;
                            return object.getHyperCubeData("/qHyperCubeDef", [nxPageToGet]);
                        } else if (layout.hasOwnProperty('qListObject')) {
                            nxPageToGet.qWidth = w;
                            nxPageToGet.qHeight = h;
                            return object.getListObjectData("/qListObjectDef", [nxPageToGet]);
                        } else {
                            return {};
                        }
                    }))
            .then(data => {
                session.close();
                reply(data);
            })
            .catch(genericCatch);
        }
    }, 
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/pivotdata',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "object", request.params.objId, "pivotdata");
            var _global = {};
            const session = createSession();
            var nxPageToGet = nxPage;
            var w = 1, h = 10000;
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId);
            })
            .catch(catchSessionOpen)
            .then(doc => doc.getObject(request.params.objId))
            .then(object => 
                object.getLayout()
                .then(layout => {
                    if (layout.hasOwnProperty('qHyperCube')) {
                        if (layout.qHyperCube.hasOwnProperty('qPivotDataPages')) {
                            //return layout.qHyperCube.qPivotDataPages;
                            w = layout.qHyperCube.qDimensionInfo.length + layout.qHyperCube.qMeasureInfo.length;
                            if (w > 1) {
                                h = Math.floor(10000 / w);
                            }
                            nxPageToGet.qWidth = w;
                            nxPageToGet.qHeight = h;
                            return object.getHyperCubePivotData("/qHyperCubeDef", [nxPageToGet]);
                        } else {
                            return [];
                        }
                    } else {
                        return [];
                    }
                }))
            .then(data => {
                session.close();
                reply(data);
            })
            .catch(genericCatch);
        }
    }, 
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/layers',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "object", request.params.objId, "layers");
            var _global = {};
            const session = createSession();
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId);
            })
            .catch(catchSessionOpen)
            .then(doc => doc.getObject(request.params.objId))
            .then(object =>
                object.getLayout()
                    .then((layout) => {
                        if (layout.hasOwnProperty('layers')) {
                            return layout.layers;
                        } else {
                            return [];
                        }
                    }))
            .then(layers => {
                session.close();
                reply({
                    layers: layers
                });
            })
            .catch(genericCatch);
        }
    }, 
    {
        method: 'POST',
        path: '/v1/doc/{docId}/hypercube',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "hypercube");
            var _global = {};
            const session = createSession();
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId);
            })
            .catch(catchSessionOpen)
            .then(doc => {
                var qHyperCubeDef = {};
                if (request.payload.hasOwnProperty('qHyperCubeDef')) {
                    qHyperCubeDef = request.payload.qHyperCubeDef;
                } else {
                    qHyperCubeDef = request.payload;
                }
                qHyperCubeDef.qInitialDataFetch = [nxPage];
                return doc.createSessionObject({
                    qInfo: typeRisotto,
                    qHyperCubeDef: qHyperCubeDef
                })
            })
            .then(obj =>
                obj.getLayout()
                .then(layout => {
                    if (layout.hasOwnProperty('qHyperCube')) {
                        return layout.qHyperCube;
                    } else {
                        return {};
                    }
                })
            )
            .then(cube => {
                session.close();
                reply({
                    qHyperCube: cube
                });
            })
            .catch(genericCatch);
        }
    }, 
    {
        method: 'POST',
        path: '/v1/doc/{docId}/hypercube/size',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "hypercube size");
            var _global = {};
            const session = createSession();
            var res = {};
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId);
            })
            .catch(catchSessionOpen)
            .then(doc => {
                var qHyperCubeDef = {};
                if (request.payload.hasOwnProperty('qHyperCubeDef')) {
                    qHyperCubeDef = request.payload.qHyperCubeDef;
                } else {
                    qHyperCubeDef = request.payload;
                }
                qHyperCubeDef.qInitialDataFetch = [nxPage];
                return doc.createSessionObject({
                    qInfo: typeRisotto,
                    qHyperCubeDef: qHyperCubeDef
                })
            })
            .then(obj =>
                obj.getLayout()
                .then(layout => {
                    if (layout.hasOwnProperty('qHyperCube') && layout.qHyperCube.hasOwnProperty('qSize')) {
                        res = {
                            columns: layout.qHyperCube.qSize.qcx,
                            rows: layout.qHyperCube.qSize.qcy,
                            pages: Math.ceil((layout.qHyperCube.qSize.qcx + layout.qHyperCube.qSize.qcy) / 10000)
                        };
                        return res;
                    } else {
                        return {};
                    }
                })
            )
            .then(area => {
                session.close();
                reply(area);
            })
            .catch(genericCatch);
        }
    },
    {
        method: 'POST',
        path: '/v1/doc/{docId}/hypercube/json/{pageNo*}',
        handler: (request, reply) => {
            if (debug) console.log("doc", request.params.docId, "hypercube/json");
            var _global = {};
            const session = createSession();
            var qHyperCubeDef = {};
            var w = 0, h = 10000, t = 0, page = 1;
            var nxPageToGet = nxPage;
            if (request.params.hasOwnProperty('pageNo')) {
                try {
                    page = parseInt(request.params.pageNo, 10);
                } catch(error) {
                    if (debug) console.log(error);
                }
            }
            session.open()
            .then(global => {
                _global = global;
                return global.openDoc(request.params.docId);
            })
            .catch(catchSessionOpen)
            .then(doc => {
                try {
                    if (debug) console.log(JSON.stringify(request.payload, null, 4));
                } catch (e) {
                }
                if (request.payload.hasOwnProperty('qHyperCubeDef')) {
                    qHyperCubeDef = request.payload.qHyperCubeDef;
                } else {
                    qHyperCubeDef = request.payload;
                }
                qHyperCubeDef.qInitialDataFetch = [nxPage];
                // used later for                             
                if (qHyperCubeDef.hasOwnProperty('qDimensions')) {
                    w += qHyperCubeDef.qDimensions.length;
                }
                if (qHyperCubeDef.hasOwnProperty('qMeasures')) {
                    w += qHyperCubeDef.qMeasures.length;
                }
                if (w > 1) {
                    h = Math.floor(10000 / w);
                }
                if (page > 1) {
                    t = h * (page -1);
                }
                nxPageToGet.qTop = t;
                nxPageToGet.qWidth = w;
                nxPageToGet.qHeight = h;
                if (debug) console.log("nxPageToGet",nxPageToGet);
                return doc.createSessionObject({
                    qInfo: typeRisotto,
                    qHyperCubeDef: qHyperCubeDef
                });
            })
            .then(obj =>
                obj.getLayout()
                .then(layout => {
                    if (layout.hasOwnProperty('qHyperCube')) {
                        return layout.qHyperCube;
                    } else {
                        return {};
                    }
                })
                .then(layout => {
                    var names = [],
                        types = [];
                    if (layout.hasOwnProperty('qDimensionInfo')) {
                        layout.qDimensionInfo.forEach((dim) => {
                            names.push(dim.qFallbackTitle);
                            if (dim.qTags.indexOf(fieldTags.date) > -1 || dim.qTags.indexOf(fieldTags.timestamp) > -1) {
                                types.push(fieldTypes.timestamp);
                            } else {
                                types.push(dim.qDimensionType);
                            }
                        });
                    }
                    if (layout.hasOwnProperty('qMeasureInfo')) {
                        layout.qMeasureInfo.forEach((measure) => {
                            names.push(measure.qFallbackTitle);
                            types.push(measureTypes[measure.qNumFormat.qType]);
                        });
                    }
                    if (debug) console.log('fieldNames:', names, 'fieldTypes:', types);

                    return obj.getHyperCubeData("/qHyperCubeDef", [nxPageToGet])
                    .then(cube => {
                        session.close();
                        var res = [];
                        if(cube.length > 0 && cube[0].hasOwnProperty('qMatrix')) {
                            cube[0].qMatrix.forEach(row => {
                                var resVal = {};
                                row.forEach((value, i) => {
                                    if (value.hasOwnProperty('qIsNull') && value.qIsNull) {
                                        resVal[names[i]] = null;
                                    } else {
                                        if (types[i] == fieldTypes.discrete) {
                                            resVal[names[i]] = value.qText;
                                        } else if (types[i] == fieldTypes.numeric) {
                                            resVal[names[i]] = value.qNum;
                                        } else if (types[i] == fieldTypes.timestamp) {
                                            resVal[names[i]] = dateFromQlikNumber(value.qNum).toJSON();
                                        }
                                    }
                                });
                                res.push(resVal);
                            });        
                        }
                        return res;
                    });
                })
            )
            .then(res => {
                reply(res);                        
            })
            .catch(genericCatch);
        }
    }];
