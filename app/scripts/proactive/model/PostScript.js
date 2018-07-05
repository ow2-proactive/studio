define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/Script',
        'text!proactive/templates/script-form-template.html'
    ],

    function (Backbone, SchemaModel, Script, tpl) {

    "use strict";

    var scriptTemplate = _.template(tpl);

    return Script.extend({
        defaults: {
            "CatalogKind": "Script/post"
        }
    })
})