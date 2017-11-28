define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/ControlFlow'
    ],

    function (Backbone, SchemaModel, ControlFlow) {

    "use strict";

    return SchemaModel.extend({
        schema: {
            "Script": {type: 'NestedModel', model: ControlFlow, fieldAttrs: {'placeholder': 'script', "data-tab": 'Control Flow'}}
        }
    })
})
