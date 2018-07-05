define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/Script',
        'text!proactive/templates/script-form-template.html',
        'proactive/config'
    ],

    function (Backbone, SchemaModel, Script, tpl, config) {

    "use strict";

    var scriptTemplate = _.template(tpl);

    return Script.extend({
        schema: SchemaModel.prototype.mergeObjectsPreserveOrder(
            Script.prototype.schema,
            {
                "Language": {type: 'Select', options: config.languages_available['forkenvironment'], fieldAttrs: {'placeholder': 'code->@attributes->language'}}
            }),
        defaults: {
            "CatalogKind": "Script/environment"
        }
    })
})