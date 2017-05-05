// Copyright 2016, EMC, Inc.

'use strict';

var di = require('di');

module.exports = runnerFactory;

di.annotate(runnerFactory, new di.Provide('TaskGraph.Runner'));
di.annotate(runnerFactory, new di.Inject(
        'Services.Core',
        'Task.Messenger',
        'Task.Runner',
        'Promise'
    )
);
function runnerFactory(
    core,
    taskMessenger,
    TaskRunner,
    Promise
) {
    /**
     * @construtor
     */
    function Runner() {
        this.taskRunner = null;
    }

    /**
     *
     * @param options - run options, specifies which services to start
     * @param [options.domain] Optional domain string to run all services in, defaults to
     *                         Constants.DefaultTaskDomain ('default')
     *
     * @memberOf Runner
     */
    Runner.prototype.start = function(options) {
        var self = this;

        return core.start()
        .then(function() {
            return [
                taskMessenger.start()
            ];
        })
        .spread(function() {
            var startPromises = [];
            self.taskRunner = TaskRunner.create({ domain: options.domain });
            startPromises.push(self.taskRunner.start());
            return startPromises;
        });
    };

    /**
     * @memberOf Runner
     */
    Runner.prototype.stop = function() {
        var self = this;

        return Promise.resolve()
        .then(function() {
            var stopPromises = [];
            stopPromises.push(self.taskRunner.stop());
            return stopPromises;
        })
        .spread(function() {
            return core.stop();
        });
    };

    return new Runner();
}
