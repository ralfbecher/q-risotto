const pjson = require('../package.json');
const config = require('../config');
const path = require('path');
const fs = require('fs');
const createSession = require('../session');

const catchSessionOpen = error => {
    console.error('Failed to open session and/or retrieve the app list:', error);
    process.exit(1);
}

const genericCatch = error => console.error('Error occured:', error);

const dateFromQlikNumber = n => {
    // return: Date from QlikView number
    var d = new Date(Math.round((n - 25569) * 86400 * 1000));
    // since date was created in UTC shift it to the local timezone
    d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
    return d;
}

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
            console.log("doc", request.params.docId);
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
            console.log("doc objects", request.params.docId);
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
            console.log("doc", request.params.docId, "object", request.params.objId);
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
            console.log("doc", request.params.docId, "object", request.params.objId, "layout");
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
            console.log("doc", request.params.docId, "object", request.params.objId, "data");
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
                        .then(layout => {
                            // TODO: implement paging
                            if (layout.hasOwnProperty('qHyperCube')) {
                                const w = layout.qHyperCube.qDimensionInfo.length + layout.qHyperCube.qMeasureInfo.length;
                                const h = Math.floor(10000 / w);
                                return object.getHyperCubeData("/qHyperCubeDef", [{
                                    "qTop": 0,
                                    "qLeft": 0,
                                    "qWidth": w,
                                    "qHeight": h
                                }]);
                            } else if (layout.hasOwnProperty('qListObject')) {
                                return object.getListObjectData("/qListObjectDef", [{
                                    "qTop": 0,
                                    "qLeft": 0,
                                    "qWidth": 1,
                                    "qHeight": 10000
                                }]);
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
    }, {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/pivotdata',
        handler: (request, reply) => {
            console.log("doc", request.params.docId, "object", request.params.objId, "pivotdata");
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
                    .then(layout => {
                        if (layout.hasOwnProperty('qHyperCube')) {
                            if (layout.qHyperCube.hasOwnProperty('qPivotDataPages')) {
                                //return layout.qHyperCube.qPivotDataPages;
                                const w = layout.qHyperCube.qDimensionInfo.length + layout.qHyperCube.qMeasureInfo.length;
                                const h = Math.floor(10000 / w);
                                return object.getHyperCubePivotData("/qHyperCubeDef", [{
                                    "qTop": 0,
                                    "qLeft": 0,
                                    "qWidth": w,
                                    "qHeight": h
                                }]);
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
    }, {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/layers',
        handler: (request, reply) => {
            console.log("doc", request.params.docId, "object", request.params.objId, "layers");
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
    }, {
        method: 'POST',
        path: '/v1/doc/{docId}/hypercube',
        handler: (request, reply) => {
            console.log("doc", request.params.docId, "hypercube");
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
                    return doc.createSessionObject({
                        qInfo: {
                            qType: 'qrisotto'
                        },
                        qHyperCubeDef: qHyperCubeDef
                    })
                })
                .then(cube =>
                    cube.getLayout()
                        .then(layout => {
                            if (layout.hasOwnProperty('qHyperCube')) {
                                return layout.qHyperCube;
                            } else {
                                return {};
                            }
                        }))
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
        path: '/v1/doc/{docId}/hypercube/json',
        handler: (request, reply) => {
            console.log("doc", request.params.docId, "hypercube/json");
            var _global = {};
            const session = createSession();
            session.open()
                .then(global => {
                    _global = global;
                    return global.openDoc(request.params.docId);
                })
                .catch(catchSessionOpen)
                .then(doc => {
                    try {
                        console.log(JSON.stringify(request.payload, null, 4));
                    } catch (e) {
                    }
                    var qHyperCubeDef = {};
                    if (request.payload.hasOwnProperty('qHyperCubeDef')) {
                        qHyperCubeDef = request.payload.qHyperCubeDef;
                    } else {
                        qHyperCubeDef = request.payload;
                    }
                    return doc.createSessionObject({
                        qInfo: {
                            qType: 'qrisotto'
                        },
                        qHyperCubeDef: qHyperCubeDef
                    })
                })
                .then(cube =>
                    cube.getLayout()
                        .then((layout) => {
                            if (layout.hasOwnProperty('qHyperCube')) {
                                return layout.qHyperCube;
                            } else {
                                return {};
                            }
                        }))
                .then(cube => {
                    session.close();
                    var fieldNames = [],
                        fieldTypes = [],
                        measureTypesMap = {
                            "U": "D",
                            "A": "D",
                            "I": "N",
                            "R": "N",
                            "F": "N",
                            "M": "N",
                            "D": "T",
                            "T": "T",
                            "TS": "T",
                            "IV": "D"
                        },
                        res = [];
                    if (cube.hasOwnProperty('qDimensionInfo')) {
                        cube.qDimensionInfo.forEach((dim) => {
                            fieldNames.push(dim.qFallbackTitle);
                            if (dim.qTags.indexOf('$date') > -1 || dim.qTags.indexOf('$timestamp') > -1) {
                                fieldTypes.push('T'); // T for Time (Timestamp)
                            } else {
                                fieldTypes.push(dim.qDimensionType); //D for discrete (String), N for numeric (Double)
                            }
                        });
                    }
                    if (cube.hasOwnProperty('qMeasureInfo')) {
                        cube.qMeasureInfo.forEach((measure) => {
                            fieldNames.push(measure.qFallbackTitle);
                            fieldTypes.push(measureTypesMap[measure.qNumFormat.qType]);
                        });
                    }
                    console.log('fieldNames:', fieldNames);
                    console.log('fieldTypes:', fieldTypes);
                    if (cube.hasOwnProperty('qDataPages')) {
                        cube.qDataPages.forEach(dataPage => {
                            dataPage.qMatrix.forEach(row => {
                                var resVal = {};
                                row.forEach((value, i) => {
                                    if (value.hasOwnProperty('qIsNull') && value.qIsNull) {
                                        resVal[fieldNames[i]] = null;
                                    } else {
                                        if (fieldTypes[i] == "D") {
                                            resVal[fieldNames[i]] = value.qText;
                                        } else if (fieldTypes[i] == "N") {
                                            resVal[fieldNames[i]] = value.qNum;
                                        } else if (fieldTypes[i] == "T") {
                                            resVal[fieldNames[i]] = dateFromQlikNumber(value.qNum).toJSON();
                                        }
                                    }
                                });
                                res.push(resVal);
                            });
                        });
                    }
                    reply(res);
                })
                .catch(genericCatch);
        }
    }];
