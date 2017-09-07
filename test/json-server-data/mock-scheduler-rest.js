// server.js
var PORT = 9000;
var jsonServer = require('json-server');
var express = require('express');
var server = jsonServer.create();
var bucket1000ResRouter = jsonServer.router('test/json-server-data/buckets-resources/bucket-id-1000-res.json');
var bucket1001ResRouter = jsonServer.router('test/json-server-data/buckets-resources/bucket-id-1001-res.json');
var bucket1002ResRouter = jsonServer.router('test/json-server-data/buckets-resources/bucket-id-1002-res.json');
var object1RevRouter = jsonServer.router('test/json-server-data/objects-revisions/2min-cron-rev.json');
var object2RevRouter = jsonServer.router('test/json-server-data/objects-revisions/cloud-automation-rev.json');
var object3RevRouter = jsonServer.router('test/json-server-data/objects-revisions/data-mgnt-rev.json');
var object4RevRouter = jsonServer.router('test/json-server-data/objects-revisions/distrib-comput-rev.json');
var object5RevRouter = jsonServer.router('test/json-server-data/objects-revisions/docker-exec-env-rev.json');
var object6RevRouter = jsonServer.router('test/json-server-data/objects-revisions/file-trigger-rev.json');
var object7RevRouter = jsonServer.router('test/json-server-data/objects-revisions/proactive-rev.json');
var object8RevRouter = jsonServer.router('test/json-server-data/objects-revisions/proactive-delete-rev.json');
var bucketsRouter = jsonServer.router('test/json-server-data/buckets-list.json');
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

server.use('/catalog/buckets/1000/resources/2%20Minutes%20Cron', object1RevRouter);
server.use('/catalog/buckets/1000/resources/Cloud%20Automation', object2RevRouter);
server.use('/catalog/buckets/1000/resources/Data%20Management', object3RevRouter);
server.use('/catalog/buckets/1000/resources/Distributed%20Computing', object4RevRouter);
server.use('/catalog/buckets/1000/resources/Docker%20Exec.%20Env.', object5RevRouter);
server.use('/catalog/buckets/1000/resources/File%20Trigger', object6RevRouter);
server.use('/catalog/buckets/1001/resources/ProActive', object7RevRouter);
server.use('/catalog/buckets/1001/resources/ProActive%20delete', object8RevRouter);

server.use('/catalog/buckets/1000', bucket1000ResRouter);
server.use('/catalog/buckets/1001', bucket1001ResRouter);
server.use('/catalog/buckets/1002', bucket1002ResRouter);

server.use('/catalog', bucketsRouter);
server.use('/rest/studio', templatesRouter);

server.listen(PORT, function () {
    console.log('JSON Server is running on port ' + PORT);
    console.log('Use the following credentials to log in:');
    console.log('    user: user');
    console.log('    password: pwd');
});

