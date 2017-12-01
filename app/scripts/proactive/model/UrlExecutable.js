define(
    [
        'backbone',
        'proactive/model/SchemaModel'
    ],

    function (Backbone, SchemaModel) {

        "use strict";

        return SchemaModel.extend({
        schema: {
            "Script From Url": {
                type: "Text",
                fieldAttrs: {
                    'placeholder': 'file->@attributes->url',
                    "data-help":'A Url which contains the Script to be executed.'
                }
            },
            "Language": {
                type: 'Select',
                options: [" ", "bash", "cmd", "docker-compose", "groovy", "javascript", "python", "cpython", "ruby", "perl", "powershell", "R"],
                fieldAttrs: {
                    'placeholder': 'code->@attributes->language',
                    "data-help":"The language of the code to execute."
                }
            }
        }
    })
})
