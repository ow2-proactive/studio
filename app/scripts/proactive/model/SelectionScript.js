define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'text!proactive/templates/script-form-template.html'
    ],

    function (Backbone, SchemaModel, tpl) {

    "use strict";

    var scriptTemplate = _.template(tpl);

    return SchemaModel.extend({
        // TODO inherit from Script - first attempt did not work because schema is shared - type appears in pre/post scripts as well
        schema: {
            "Script": {type: "TextArea", fieldAttrs: {'placeholder': ['code->#cdata-section', 'code->#text']}, template: scriptTemplate},
            "Language": {type: 'Select', options: [" ", "bash", "cmd", "groovy", "javascript", "python", "ruby", "perl", "powershell", "R"], fieldAttrs: {'placeholder': 'code->@attributes->language'}},
            "Or Path": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->path'}},
            "Arguments": {type: 'Hidden', itemType: 'Text', fieldAttrs: {'placeholder': 'file->arguments->argument', 'itemplaceholder': '@attributes->value'}},
            "Or Url": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->url'}},
            "Type": {type: 'Select', options: ["dynamic", "static"], fieldAttrs: {'placeholder': '@attributes->type'}}
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
