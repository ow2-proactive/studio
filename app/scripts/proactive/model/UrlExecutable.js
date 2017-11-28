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
            }
        }
    })
})
