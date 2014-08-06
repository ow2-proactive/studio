define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/Script',
        'proactive/model/utils'
    ],

    function (Backbone, SchemaModel, Script, Utils) {

    "use strict";

    return SchemaModel.extend({
        schema: {
            "Class": {type: "Text", fieldAttrs: {'placeholder': '@attributes->class', "data-help":'A java class extending the Scheduler API. It can be in a jas attached to job classpath (see job properties).'}},
            "Application Parameters": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'parameters->parameter', "data-help":'Java application parameters.'}, itemToString: Utils.inlineName, subSchema: {
                "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}}
            }},
            "Fork Environment": {type: 'Select', fieldAttrs: {'placeholder': 'forkEnvironment', 'strategy': 'checkpresence', "data-help":'By default the program will be executed in node JVM. If this options is set to \"Fork new JVM\" scheduler will execute the command in the new forked JVM. It allows to modify JVM parameters like classpath etc.'},
                options: [
                    {val: "false", label: "Use the Proactive Node JVM"},
                    {val: "true", label: "Fork a new JVM"}
                ]},
            "Java Home": {type: "Text", fieldAttrs: {'placeholder': 'forkEnvironment->@attributes->javaHome', "data-help":'Java installation directory on the node side. Must not include /bin/java.'}},
            "Jvm Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'forkEnvironment->jvmArgs->jvmArg', 'itemplaceholder': '@attributes->value', "data-help":'JVM properties e.g:<br/>-Xmx2G<br/>-Dprop.name=value'}},
            "Working Dir": {type: "Text", fieldAttrs: {'placeholder': 'forkEnvironment->@attributes->workingDir', "data-help":'JVM working directory'}},
            "Additional Classpath": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'forkEnvironment->additionalClasspath->pathElement', 'itemplaceholder': '@attributes->path', "data-help":'The list of \"pathElement\" representing the classpath to be added when starting the new JVM.'}},
            "Environment Variables": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'forkEnvironment->SystemEnvironment->variable', "data-help":'The list of system variables that will be added to the forked JVM process'}, subSchema: {
                "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}},
                "Append": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->append'}},
                "Append Char": {type: "Text", fieldAttrs: {'placeholder': '@attributes->appendChar'}}
            }},
            "Environment Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'forkEnvironment->envScript->script', "data-help":'Environment script that is able to add/change each items of the fork environment programmatically.'}}
        },
        initialize: function () {
            this.set({"Fork Environment": "false"});
        }
    })
})
