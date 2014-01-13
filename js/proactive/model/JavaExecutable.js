(function ($) {
    JavaExecutable = SchemaModel.extend({
        schema: {
            "Class": {type: "Text", fieldAttrs: {'placeholder': '@attributes->class'}},
            "Application Parameters": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'parameters->parameter'}, itemToString: inlineName, subSchema: {
                "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}}
            }},
            "Fork Environment": {type: 'Select', fieldAttrs: {'placeholder': 'forkEnvironment', 'strategy': 'checkpresence'},
                options: [
                    {val: "false", label: "Use the Proactive Node JVM"},
                    {val: "true", label: "Fork a new JVM"}
                ]},
            "Java Home": {type: "Text", fieldAttrs: {'placeholder': 'forkEnvironment->@attributes->javaHome'}},
            "Jvm Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'forkEnvironment->jvmArgs->jvmArg', 'itemplaceholder': '@attributes->value'}},
            "Working Dir": {type: "Text", fieldAttrs: {'placeholder': 'forkEnvironment->@attributes->workingDir'}},
            "Additional Classpath": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'forkEnvironment->additionalClasspath->pathElement', 'itemplaceholder': '@attributes->path'}},
            "Environment Variables": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'forkEnvironment->SystemEnvironment->variable'}, subSchema: {
                "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}},
                "Append": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->append'}},
                "Append Char": {type: "Text", fieldAttrs: {'placeholder': '@attributes->appendChar'}}
            }},
            "Environment Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'forkEnvironment->envScript->script'}}
        },
        initialize: function () {
            this.set({"Fork Environment": "false"});
        }
    });
})(jQuery);
