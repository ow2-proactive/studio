define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/script/ForkEnvironmentScript',
        'proactive/model/utils'
    ],

    function (Backbone, SchemaModel, ForkEnvironmentScript, Utils) {

        "use strict";

        return SchemaModel.extend({
            schema: {
                "Java Home": {
                    type: "Text",
                    fieldAttrs: {
                        'placeholder': '@attributes->javaHome',
                        "data-help": 'Java installation directory on the node side. Must not include /bin/java.'
                    }
                },
                "Jvm Arguments": {
                    type: 'List',
                    itemType: 'Text',
                    fieldAttrs: {
                        'placeholder': 'jvmArgs->jvmArg',
                        'itemplaceholder': '@attributes->value',
                        "data-help": 'JVM properties e.g:<br/>-Xmx2G<br/>-Dprop.name=value'
                    },
                    itemTemplate: Utils.bigCrossTemplate
                },
                "Working Folder": {
                    type: "Text",
                    fieldAttrs: {
                        'placeholder': '@attributes->workingDir',
                        "data-help": 'A working folder of the executable on computing nodes.'
                    }
                },
                "Additional Classpath": {
                    type: 'List',
                    itemType: 'Text',
                    fieldAttrs: {
                        'placeholder': 'additionalClasspath->pathElement',
                        'itemplaceholder': '@attributes->path',
                        "data-help": 'The list of \"pathElement\" representing the classpath to be added when starting the new JVM.'
                    },
                    itemTemplate: Utils.bigCrossTemplate
                },
                "Environment Variables": {
                    type: 'List',
                    itemType: 'Object',
                    fieldAttrs: {
                        'placeholder': 'SystemEnvironment->variable',
                        "data-help": 'The list of system variables that will be added to the forked JVM process'
                    },
                    subSchema: {
                        "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                        "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}},
                    },
                    itemTemplate: Utils.bigCrossTemplate
                },
                "Environment Script": {
                    type: 'NestedModel',
                    model: ForkEnvironmentScript,
                    fieldAttrs: {
                        'placeholder': 'envScript',
                        "data-help": 'A script which can be used to configure programmatically the task&#39;s forked JVM process. The environment script is run before any other task script (pre, task, etc).'
                    }
                }
            }
        })
    })
