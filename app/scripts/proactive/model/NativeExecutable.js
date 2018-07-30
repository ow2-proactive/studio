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
            "Command": {
                type: "Text", 
                fieldAttrs: {
                    'placeholder': 'staticCommand->@attributes->value', 
                    "data-help":'A native executable to run. Must not contain parameters. E.g. for command \"/bin/bash echo test\" only /bin/bash should be specified here. Everything else should be set as arguments.'
                }
            },
            "Arguments": {
                type: 'List', 
                itemType: 'Text',
                fieldAttrs: {
                    'placeholder': 'staticCommand->arguments->argument', 
                    'itemplaceholder': '@attributes->value', 
                    "data-help":'Command line arguments. Do not use space as a separator for arguments. Rather add all of arguments one by one to the list.'
                },
                itemTemplate: Utils.bigCrossTemplate
            },
        }
    })
})
