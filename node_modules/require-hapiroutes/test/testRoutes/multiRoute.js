module.exports.routes = [
  {
    method : 'GET',
    path : '/route1',
    handler : function(req, reply) {},
    config : {
      description: 'my route1 description',
      notes: 'Important stuff to know about this route',
      tags : ['app']
    }
  },
  {
    method : 'GET',
    path : '/route2',
    handler : function(req, reply) {},
    config : {
      description: 'my route1 description',
      notes: 'Important stuff to know about this route',
      tags : ['app']
    }
  }
]
