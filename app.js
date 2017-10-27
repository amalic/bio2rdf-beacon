'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 80;
  app.listen(port);

  if (swaggerExpress.runner.swagger.paths['/types']) {
    console.log('try this');
    console.log('curl http://127.0.0.1:' + port + '/api/types');
    console.log('curl http://127.0.0.1:' + port + '/api/concepts/1');
    console.log('curl http://127.0.0.1:' + port + '/api/concepts?keywords=test');
    console.log('curl http://127.0.0.1:' + port + '/api/exactmatches/1');
    console.log('curl http://127.0.0.1:' + port + '/api/exactmatches?c=test');
    console.log('curl http://127.0.0.1:' + port + '/api/statements?c=temp');
    console.log('curl http://127.0.0.1:' + port + '/api/evidence/1');
  }
});