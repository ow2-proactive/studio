const PORT = 9000;
const jsonServer = require('json-server');
const express = require('express');
const parseFormdata = require('parse-formdata');

const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// Define routers for different resources
const bucket1000ResRouter = jsonServer.router('test/json-server-data/buckets-resources/bucket-id-1000-res.json');
const bucket1001ResRouter = jsonServer.router('test/json-server-data/buckets-resources/bucket-id-1001-res.json');
const bucket1002ResRouter = jsonServer.router('test/json-server-data/buckets-resources/bucket-id-1002-res.json');
const object1RevRouter = jsonServer.router('test/json-server-data/objects-revisions/2min-cron-rev.json');
const object2RevRouter = jsonServer.router('test/json-server-data/objects-revisions/cloud-automation-rev.json');
const object3RevRouter = jsonServer.router('test/json-server-data/objects-revisions/data-mgnt-rev.json');
const object4RevRouter = jsonServer.router('test/json-server-data/objects-revisions/distrib-comput-rev.json');
const object5RevRouter = jsonServer.router('test/json-server-data/objects-revisions/docker-exec-env-rev.json');
const object6RevRouter = jsonServer.router('test/json-server-data/objects-revisions/file-trigger-rev.json');
const object7RevRouter = jsonServer.router('test/json-server-data/objects-revisions/proactive-rev.json');
const object8RevRouter = jsonServer.router('test/json-server-data/objects-revisions/proactive-delete-rev.json');
const bucketsRouter = jsonServer.router('test/json-server-data/buckets-list.json');
const templatesRouter = jsonServer.router('test/json-server-data/templates.json');

server.use(middlewares);

server.post('/rest/studio/login', function (req, res, next) {
    console.log('LOGIN');
    parseFormdata(req, function (err, data) {
        if (err) {
            console.error('Error parsing form data:', err);
            if (!res.headersSent) {
                res.status(500).end();
            }
            return;
        }

        const { username, password } = data.fields;

        console.log("Received username:", username);
        console.log("Received password:", password);

        if (username === 'user' && password === 'pwd') {
            console.log('Login successful');
            if (!res.headersSent) {
                res.setHeader('content-type', 'application/json');
                res.status(200).json({ sessionId: 'MOCKED_SESSION_ID' });
            }
        } else {
            console.log('Invalid credentials');
            if (!res.headersSent) {
                res.status(401).end();
            }
        }
    });
});

server.put('/rest/studio/logout', function (req, res, next) {
    console.log('LOGOUT');
    if (!res.headersSent) {
        res.setHeader('content-type', 'application/json');
        res.status(204).end();
    }
});

server.get('/rest/studio/connected', function (req, res, next) {
    console.log('CHECK FOR AUTH');
    if (!res.headersSent) {
        res.setHeader('content-type', 'application/json');
        res.status(200).write('true');
        res.end();
    }
});

server.get('/rest/common/permissions/portals/studio', function (req, res, next) {
    console.log('CHECK FOR PERMISSION');
    if (!res.headersSent) {
        res.setHeader('content-type', 'application/json');
        res.status(200).write('true');
        res.end();
    }
});

server.post('/rest/studio/validate', function (req, res, next) {
    console.log('VALIDATE');
    if (!res.headersSent) {
        res.setHeader('content-type', 'application/json');
        res.status(200).write('{"valid":true,"taskName":null,"errorMessage":null,"stackTrace":null}');
        res.end();
    }
});

server.use(express.static('public'));

// Define the routes for different resources
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
