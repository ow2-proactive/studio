define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'text!proactive/templates/script-code-form-template.html',
        'proactive/config',
        'proactive/model/utils'
    ],

    function (Backbone, SchemaModel, tpl, config, Utils) {

        "use strict";

        return function(catalogKind, codeDataHelp, scriptCodeTemplate, scriptCodeClass, scriptArgumentsClass) {
            if (!scriptCodeTemplate) {
                var scriptCodeTemplate = _.template("<% var catalogKind = '"+catalogKind+"'; %>" +tpl);
            }

            if (!codeDataHelp) {
                var codeDataHelp = "A script written in Groovy, Ruby, Python and other languages supported by the JSR-223.";
            }

            if (!scriptCodeClass) {
                var scriptCodeClass = 'blank';
            }

            if (!scriptArgumentsClass) {
                var scriptArgumentsClass = 'blank';
            }

            return SchemaModel.extend({
                language: 'Script',
                schema: {
                    "Code": {
                        type: "TextArea",
                        editorClass: scriptCodeClass,
                        fieldAttrs: {
                            'placeholder': ['code->#cdata-section', 'code->#text'],
                            "data-help": codeDataHelp
                            },
                            template: scriptCodeTemplate
                    },
                    "Language": {
                        type: 'Select',
                        options: config.languages_available[catalogKind],
                        fieldAttrs: {
                            'placeholder': 'code->@attributes->language',
                            "data-help":"The language of the code to execute."
                        }
                    },
                    "Arguments": {
                        type: 'List',
                        itemType: 'Text',
                        editorClass: scriptArgumentsClass,
                        fieldAttrs: {
                            'placeholder': 'arguments->argument',
                            'itemplaceholder': '@attributes->value',
                            'data-help' : 'Arguments given to the script, which can be accessed inside the script through the binding <u>args</u>.'
                            },
                        itemTemplate: Utils.bigCrossTemplate
                    }
                }
            });
        }
})
