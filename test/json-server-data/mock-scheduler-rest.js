// server.js
var jsonServer = require('json-server');
var express = require('express');
var server = jsonServer.create();
var workflowCatalogRouter = jsonServer.router('test/json-server-data/workflow-catalog.json');
var bucketsRouter = jsonServer.router('test/json-server-data/buckets.json');
var templatesRouter = jsonServer.router('test/json-server-data/templates.json');
var middlewares = jsonServer.defaults();
server.use(middlewares);

server.post('/rest/studio/login', function (req, res, next) {
    console.log('LOGIN');
    var data = "";
    req.on('data', function(chunk) {
	console.log("Received body data:");
	console.log(chunk.toString());
	data += chunk.toString();
    });
    req.on('end', function() {
	console.log('body:');
	console.log(data);
	
	// We assume the request is well formed
	var pairs = data.split('&');
	var username = pairs[0].split('=')[1];
	var password = pairs[1].split('=')[1];

	// check the user/pass
	var statusCode = 404;
	if (username == 'user' && password == 'pwd') {
	    console.log('login successful');
	    statusCode = 200;
	}
	res.status(statusCode);
	res.setHeader('content-type', 'application/json');
	res.write('MOCKED_SESSION_ID');
	res.end();
    });
});

server.put('/rest/studio/logout', function (req, res, next) {
    console.log('LOGOUT');
    res.status(204);
    res.setHeader('content-type', 'application/json');
    res.end();
});

server.get('/rest/studio/connected', function (req, res, next) {
    console.log('CHECK FOR AUTH');
    res.status(200);
    res.write('true');
    res.end();
});

server.post('/rest/studio/validate', function (req, res, next) {
    console.log('VALIDATE');
    res.status(200);
    res.write('{"valid":true,"taskName":null,"errorMessage":null,"stackTrace":null}');
    res.end();
});

server.use(express.static('public'));
server.use('/studio/mock', workflowCatalogRouter);
server.use('/workflow-catalog', bucketsRouter);
server.use('/rest/studio', templatesRouter);

server.listen(8080, function () {
    console.log('JSON Server is running');
});

