module.exports =
  {
    method : 'GET',
    path : '/route',
    config : {
      handler : function(req, reply) {},
      description: 'my route description',
      notes: 'Important stuff to know about this route and the handler is defined in the config section',
      tags : ['app']
    }
  };
