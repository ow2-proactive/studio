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
                "Language": {type: 'Select', options: config.languages_available['selection'], fieldAttrs: {'placeholder': 'code->@attributes->language'}},
                "Type": {type: 'Select', options: ["dynamic", "static"], fieldAttrs: {'placeholder': '@attributes->type'}}
            }),
        defaults: {
            "CatalogKind": "Script/selection"
        },
        populateSchema: function (obj) {
            SchemaModel.prototype.populateSchema.call(this, obj);
            var path = this.get("Or Path");
            if (path) {
                var fileName = path.replace(/^.*[\\\/]/, '');
                this.set("Library", fileName);
            }
        }

    })
})
