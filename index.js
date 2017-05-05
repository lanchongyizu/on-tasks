// Copyright 2015, EMC, Inc.

"use strict";

var di = require('di'),
    _ = require('lodash'),
    consul = require('consul'),
    core = require('on-core')(di);
var temp = require('temp');

var injectables =  _.flattenDeep([
        core.injectables,
        core.workflowInjectables,
        core.helper.requireWrapper('ssh2', 'ssh', undefined, __dirname),
        core.helper.requireWrapper('dockerode', 'Docker', undefined, __dirname),
        core.helper.simpleWrapper(temp, 'temp'),
        core.helper.requireGlob(__dirname + '/lib/*.js'),
        core.helper.requireGlob(__dirname + '/lib/jobs/*.js'),
        core.helper.requireGlob(__dirname + '/lib/utils/**/*.js'),
        core.helper.requireGlob(__dirname + '/lib/utils/*.js'),
        core.helper.requireGlob(__dirname + '/lib/services/*.js'),
        core.helper.simpleWrapper(
            core.helper.requireGlob(__dirname + '/lib/task-data/**/*.js'),
            'Task.taskLibrary'
        ),
        core.helper.requireGlob(__dirname + '/api/rest/view/**/*.js'),
        require('./api/rpc/index.js'),
        core.helper.simpleWrapper(consul, 'consul')
    ]);

var taskSchemas = core.helper.requireGlob(__dirname + '/lib/task-data/schemas/*.json');
var injector = new di.Injector(injectables);

var taskGraphRunner = injector.get('TaskGraph.Runner');
var logger = injector.get('Logger').initialize('Tasks');
var app = require('express')();
var http = require('http');
var swaggerTools = require('swagger-tools');
var parseArgs = require('minimist');

var httpPort = 9006;
var server;

var argv = parseArgs(process.argv.slice(2));

var options = {
    domain: argv.domain || argv.d,
    httpPort: argv['http-port'] || argv.p || httpPort
};

taskGraphRunner.start(options)
    .then(function() {
        return injector.get('Views').load();
    })
    .then(function() {
        logger.info('Task Runner Started.');
        if(options.httpPort) {
             // swaggerRouter configuration
             var swaggerOptions = {
                 swaggerUi: '/swagger.json',
                 controllers: './api/rest',
                 // Conditionally turn on stubs (mock mode)
                 useStubs: process.env.NODE_ENV === 'development' ? true : false

             };
             // The Swagger document (require it, build it programmatically,
             // fetch it from a URL, ...)
             var swaggerDoc = require('./api/swagger.json');

             // Initialize the Swagger middleware
             swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
                 // Interpret Swagger resources and attach metadata to request -
                 // must be first in swagger-tools middleware chain
                 app.use(middleware.swaggerMetadata());

                 // Validate Swagger requests
                 app.use(middleware.swaggerValidator());

                 // Route validated requests to appropriate controller
                 app.use(middleware.swaggerRouter(swaggerOptions));

                 // Serve the Swagger documents and Swagger UI
                 app.use(middleware.swaggerUi());

                 // Start the server
                 var config = {
                     hostname: '0.0.0.0',
                     httpPort: options.httpPort
                 };
                 server = http.createServer(app);
                 server.listen(config.httpPort, config.hostname, function () {
                     logger.info('Your server is listening on port %d ', config.httpPort);
                     logger.info('Swagger-ui is available on http://%s:%d/docs', config.hostname,
                                                                                 config.httpPort);
                 });
             });
        }
    })
    .catch(function(error) {
        //NOTE(heckj): I'm unclear why this is on the console directly and not
        // using a logger. Would expect this to be logger.critical(), but
        // leaving as is because I don't know the implications.
        console.error(error.message || error.details);
        console.error(error.stack || error.rawStack);
        //      logger.critical('Task Graph Runner Startup Error.', { error: error });

        process.nextTick(function () {
            process.exit(1);
        });
    });

process.on('SIGINT', function () {
    taskGraphRunner.stop()
        .catch(function (error) {
            logger.critical('Task Graph Runner Shutdown Error.', { error: error });
        })
        .finally(function () {
            if (server) {
                server.close();
            }
            process.nextTick(function () {
                process.exit(1);
            });
        });
});

module.exports = {
    injector: injector,
    taskSchemas: taskSchemas
};
