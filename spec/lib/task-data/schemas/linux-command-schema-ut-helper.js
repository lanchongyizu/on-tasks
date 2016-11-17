// Copyright 2016, EMC, Inc.
/* jshint node: true */

'use strict';

var canonicalCommand = {
    commands: [
        'touch foo.txt',
        {
            command: 'sudo ipmitool lan print',
            acceptedResponseCodes: [-1, 0, 1, 200],
            catalog: {
                source: 'bmc',
                format: 'json'
            },
            retries: 10,
            downloadUrl: 'http://10.0.0.1:8080/api/current/foo/ipmitool',
            timeout: 100
        },
        {
            command: 'ls /usr/bin'
        }
    ]
};

var canonicalExtra = {
    runOnlyOnce: true
};

var canonical = _.defaults(_.cloneDeep(canonicalCommand), canonicalExtra);

var negativeSetParamCommand = {
    'commands': ['', null, []],
    'commands[0]': ['', null],
    'commands[1].acceptedResponseCodes': [[], 0, 1, -1],
    'commands[1].downloadUrl': [''],
    'commands[1].timeout': [-1, 2.5],
    'commands[1].retries': [-1, 2.5],
    'commands[1].catalog.format': ['JSON', 'RAW', 'xml', 'html'] //now only support json & raw
};

var negativeSetParamExtra = {
    'runOnlyOnce': [null, 'true', 1]
};

var positiveSetParamCommand = {
    'commands[1]': 'touch foo.txt', //allow duplicated command
    'commands[1].downloadUrl': ['http://abc.com/foo', 'http://10.0.0.1:8080/foo123/123/bar', 'www.abc.com/abc'],
    'commands[1].timeout': [0, 1, 100000],
    'commands[1].retries': [0, 1, 100000],
    'commands[1].acceptedResponseCodes': [[0]],
    'commands[1].catalog.format': ['raw']
};

var positiveSetParamExtra = {};

var negativeUnsetParamCommand = [
    'commands',
    'commands[1].command',
    'commands[1].catalog.source',
    'commands[2].command'
];

var negativeUnsetParamExtra = [];

var positiveUnsetParamCommand = [
    'commands[1].acceptedResponseCodes',
    'commands[1].catalog',
    'commands[1].catalog.format',
    'commands[1].retries',
    'commands[1].downloadUrl',
    'commands[1].timeout'
];

var positiveUnsetParamExtra = [
    'runOnlyOnce'
];

module.exports = {
    testCommand: function(schemaFileName, canonicalData) {
        describe('commands validation', function() {
            canonicalData = canonicalData || canonicalCommand;
            var SchemaUtHelper = require('./schema-ut-helper');
            new SchemaUtHelper(schemaFileName, canonicalData).batchTest(
                positiveSetParamCommand, negativeSetParamCommand,
                positiveUnsetParamCommand, negativeUnsetParamCommand);
        });
    },

    test: function(schemaFileName, canonicalData) {
        describe('common linux command validation', function() {
            canonicalData = canonicalData || canonical;
            var SchemaUtHelper = require('./schema-ut-helper');
            new SchemaUtHelper(schemaFileName, canonicalData).batchTest(
                _.defaults(_.cloneDeep(positiveSetParamCommand), positiveSetParamExtra),
                _.defaults(_.cloneDeep(negativeSetParamCommand), negativeSetParamExtra),
                _.defaults(_.cloneDeep(positiveUnsetParamCommand), positiveUnsetParamExtra),
                _.defaults(_.cloneDeep(negativeUnsetParamCommand), negativeUnsetParamExtra));
        });
    },
    canonical: canonical,
    canonicalCommand: canonicalCommand
};
