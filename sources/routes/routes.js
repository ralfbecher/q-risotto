'use strict';

const routeHandler = require('./routeHandler');

module.exports.routes = [
    { // about
        method: 'GET',
        path: '/',
        handler: routeHandler.about
    },
    { // static file content (WDC)
        method: 'GET',
        path: '/{param*}',
        config: {
            auth: false
        },
        handler: routeHandler.public
    },
    {
        method: 'GET',
        path: '/v1/docs',
        handler: routeHandler.docs
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}',
        handler: routeHandler.doc
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/objects',
        handler: routeHandler.objects
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}',
        handler: routeHandler.objectId
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/layout',
        handler: routeHandler.objectLayout
    },
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/data',
        handler: routeHandler.objectData
    }, 
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/pivotdata',
        handler: routeHandler.objectPivotdata
    }, 
    {
        method: 'GET',
        path: '/v1/doc/{docId}/object/{objId}/layers',
        handler: routeHandler.objectLayers
    }, 
    {
        method: 'POST',
        path: '/v1/doc/{docId}/hypercube',
        handler: routeHandler.hyperCube
    }, 
    {
        method: 'POST',
        path: '/v1/doc/{docId}/hypercube/size',
        handler: routeHandler.hyperCubeSize
    },
    {
        method: 'POST',
        path: '/v1/doc/{docId}/hypercube/json/{pageNo*}',
        handler: routeHandler.hyperCubeJson
    }];
