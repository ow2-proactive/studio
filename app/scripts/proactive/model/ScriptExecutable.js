define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/Script',
        'proactive/model/TaskScript'
    ],

    function (Backbone, SchemaModel, Script, TaskScript) {

        "use strict";

        return SchemaModel.extend({
        schema: {
            "Script": {type: 'NestedModel', model: TaskScript, fieldAttrs: {'placeholder': 'script', "data-help":"A script written in Groovy, Ruby, Python and other languages supported by the JSR-223."}}
        }
    })
})
