define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/script/ScriptCode',
        'proactive/model/script/ScriptFile',
        'text!proactive/templates/submodel-radio-form-template.html',
        'proactive/config'
    ],

    function (Backbone, SchemaModel, ScriptCode, ScriptFile, tpl, config) {

        "use strict";

        return function(catalogKind, dataTabLabel, dataTabHelp, codeDataHelp, scriptCodeTemplate, scriptCodeClass, scriptUrlClass, scriptArgumentsClass) {

            var radioFormTemplate = _.template("<% var selectedRadioType = 'ScriptType'; %>" + tpl);

            if (!dataTabLabel) {
                var dataTabLabel = "Script Implementation";
            }

            if (!dataTabHelp) {
                var dataTabHelp = "Implementation of the script (inlined code, or url reference to an existing script)";
            }

            return SchemaModel.extend({
                schema: {

                    // ScriptType is a radio button which can select an active NestedModel
                    // The options values match each one nested model defined in this schema
                    // the placeholder defines which xml structure triggers one nested model or the other
                    "ScriptType": {
                        type: 'TaskTypeRadioEditor',
                        fieldAttrs: {
                            "data-tab": dataTabLabel,
                            'data-tab-help': dataTabHelp,
                            'placeholder': 'script->code|script->file'
                        },
                        fieldClass: 'task-type',
                        options: [
                            {val: "ScriptCode", label: "Inline Code"},
                            {val: "ScriptFile", label: "Reference"}
                        ],
                        title: ""
                    },
                    "ScriptCode": {
                        type: 'NestedModel',
                        model: ScriptCode(catalogKind, codeDataHelp, scriptCodeTemplate, scriptCodeClass, scriptArgumentsClass),
                        template: radioFormTemplate,
                        title: "",
                        fieldAttrs: {
                            'placeholder': 'script'
                        }
                    },
                    "ScriptFile": {
                        type: 'NestedModel',
                        model: ScriptFile(catalogKind, scriptUrlClass, scriptArgumentsClass),
                        template: radioFormTemplate,
                        title: "",
                        fieldAttrs: {
                            'placeholder': 'script'
                        }
                     }
                },

                defaults: {
                    ScriptType: 'ScriptCode'
                }
            })
        }
})
