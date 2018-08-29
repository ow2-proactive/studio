define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'text!proactive/templates/script-file-form-template.html',
        'proactive/config',
        'proactive/model/utils'
    ],

    function (Backbone, SchemaModel, tpl, config, Utils) {

        "use strict";

        return function(catalogKind, scriptUrlClass, scriptArgumentsClass) {

            var scriptFileTemplate = _.template("<% var catalogKind = '"+catalogKind+"'; %>" +tpl);

            if (!scriptUrlClass) {
                var scriptUrlClass = 'blank';
            }
            if (!scriptArgumentsClass) {
                var scriptArgumentsClass = 'blank';
            }

            return SchemaModel.extend({
                schema: {
                    "Url": {
                        type: "Text",
                        editorClass: scriptUrlClass,
                        fieldAttrs: {'placeholder': 'file->@attributes->url',
                                     "data-help":"The url which contains the script to be executed."},
                        template: scriptFileTemplate
                    },
                    "Language": {
                        type: 'Select',
                        options: config.languages_available[catalogKind],
                        fieldAttrs: {
                            'placeholder': 'file->@attributes->language',
                            "data-help":"The language of the script to execute (if the url does not contain already the information)."
                        }
                    },
                    "Path": {
                        type: "Hidden",
                        fieldAttrs: {'placeholder': 'file->@attributes->path'}
                    },
                    "Arguments": {
                        type: 'List',
                        itemType: 'Text',
                        editorClass: scriptArgumentsClass,
                        fieldAttrs: {
                            'placeholder': 'file->arguments->argument',
                            'itemplaceholder': '@attributes->value',
                            'data-help' : 'Arguments given to the script, which can be accessed inside the script through the binding <u>args</u>.'
                            },
                        itemTemplate: Utils.bigCrossTemplate
                    }
                }
            })
        }
})
