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
            "Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'script'}}
        }
    })
})
