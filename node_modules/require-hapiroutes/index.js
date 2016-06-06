function isRoute(route) {
  var hasHandler = route.handler || (route.config && route.config.handler);
  var hasPath = route.path;
  return hasHandler && hasPath;
}


module.exports = function(mod) {
  var debug = require('debug')('require-hapiroutes:routediscovery')
  var requireDirectory = require('require-directory');
  var dirModules = requireDirectory(mod);
  var routes = [];
  var keys = Object.keys( dirModules );


  for( var i = 0,length = keys.length; i < length; i++ ) {
    var routeModule = dirModules[ keys[ i ] ];

    //if there is a routes property definded on the module use that, otherwise assume the module is the route
    if(routeModule.routes) {
      debug('loading routes from routes property file: %s with %s routes', keys[i], routeModule.routes.length);
      Array.prototype.push.apply(routes, routeModule.routes);
    }

    if(Array.isArray(routeModule) && routeModule.length > 0 && isRoute(routeModule[0])) {
      debug('loading routes from module as an Array from file: %s', keys[i])
      Array.prototype.push.apply(routes, routeModule);
    }

    else if(isRoute(routeModule)){
      debug('loading module as a route file: %s', keys[i]);
      routes.push(routeModule);
    }
  }

  dirModules.routes = routes;

  return dirModules;
}
