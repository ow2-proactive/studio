define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/utils'
    ],

    function (Backbone, SchemaModel, Utils) {

        "use strict";

        return SchemaModel.extend({
            schema: {
                "Class": {type: "Text",
                    fieldAttrs: {
                        'placeholder': '@attributes->class',
                        "data-help": 'A java class extending the Scheduler API. It can be in a JAR attached to additional classpath (see Fork Environment).'
                    }
                },
                "Application Parameters": {
                    type: 'List',
                    itemType: 'Object',
                    itemTemplate: Utils.bigCrossTemplate,
                    fieldAttrs: {
                        'placeholder': 'parameters->parameter',
                        "data-help": 'Java application parameters.'
                    },
                    itemToString: Utils.inlineName,
                    subSchema: {
                        "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                        "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}}
                    }
                },
            }
        })
    })
