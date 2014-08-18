define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/Script'
    ],

    function (Backbone, SchemaModel, Script) {

        "use strict";

        return SchemaModel.extend({
        schema: {
            "Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'script', "data-help":"A script written in Groovy, Ruby, Python and other languages supported by the JSR-223."}}
        }
    })
})
