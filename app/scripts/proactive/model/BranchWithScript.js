define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/Script',
        'proactive/model/FlowScript',
    ],

    function (Backbone, SchemaModel, Script, FlowScript) {

    "use strict";

    return SchemaModel.extend({
        schema: {
            "Script": {type: 'NestedModel', model: FlowScript, fieldAttrs: {'placeholder': 'script', "data-tab": 'Control Flow'}}
        }
    })
})
