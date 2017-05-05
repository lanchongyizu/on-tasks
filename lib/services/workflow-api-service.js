// Copyright © 2016-2017 Dell Inc. or its subsidiaries.  All Rights Reserved.

'use strict';

var di = require('di');

module.exports = workflowApiServiceFactory;
di.annotate(workflowApiServiceFactory, new di.Provide('Http.Services.Api.Workflows'));
di.annotate(workflowApiServiceFactory,
    new di.Inject(
        'Protocol.TaskGraphRunner',
        'TaskGraph.Store',
        'Services.Waterline',
        'Protocol.Events',
        'Logger',
        'Errors',
        'Promise',
        'Constants',
        '_'
    )
);

function workflowApiServiceFactory(
    taskGraphProtocol,
    taskGraphStore,
    waterline,
    eventsProtocol,
    Logger,
    Errors,
    Promise,
    Constants,
    _
) {
    var logger = Logger.initialize(workflowApiServiceFactory);

    function WorkflowApiService() {
    }

    WorkflowApiService.prototype.defineTask = function(definition) {
        return taskGraphStore.persistTaskDefinition(definition);
    };

    WorkflowApiService.prototype.getWorkflowsTasksByName = function(injectableName) {
        return taskGraphStore.getTaskDefinitions(injectableName);
    };

    WorkflowApiService.prototype.deleteWorkflowsTasksByName = function(injectableName) {
        return taskGraphStore.getTaskDefinitions(injectableName)
            .then(function (task){
                if(_.isEmpty(task)){
                    throw new Errors.NotFoundError(
                        'Task definition not found for ' + injectableName
                    );
                }else{
                    return taskGraphStore.deleteTaskByName(injectableName);
                }
            });
    };

    WorkflowApiService.prototype.putWorkflowsTasksByName = function(definition, injectableName) {
        return taskGraphStore.getTaskDefinitions(injectableName)
            .then(function (task){
                if(_.isEmpty(task)){
                    throw new Errors.NotFoundError(
                        'Task definition not found for ' + injectableName
                    );
                }else{
                    return taskGraphStore.persistTaskDefinition(definition);
                }
            });
    };

    WorkflowApiService.prototype.getTaskDefinitions = function(injectableName) {
        return taskGraphStore.getTaskDefinitions(injectableName);
    };

    return new WorkflowApiService();
}
