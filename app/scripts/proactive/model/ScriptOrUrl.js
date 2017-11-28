define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/UrlExecutable',
        'proactive/model/ScriptExecutable'
    ],

    function (Backbone, SchemaModel, UrlExecutable, ScriptExecutable) {

    "use strict";

    return SchemaModel.extend({
        schema: {
            "Type": {
                    type: 'TaskTypeRadioEditor',
                    fieldClass: 'task-type',
                    options: [
                              {val: "ScriptExecutable", label: "Inlined Code"},
                              {val: "UrlExecutable", label: "From Url"}
                    ]
            }
        }
    })


})
