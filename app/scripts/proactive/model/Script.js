define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'text!proactive/templates/script-form-template.html',
        'proactive/rest/studio-client'
    ],

    function (Backbone, SchemaModel, tpl, StudioClient) {

    "use strict";

    var scriptTemplate = _.template(tpl);
    var serverScripts = function (callback) {
        callback(["--inline--"].concat(StudioClient.listScripts()));
    }

    return SchemaModel.extend({
        schema: {
            "Library": {type: "Select", options: serverScripts},
            "Library Path": {type: "Hidden"},
            "Script": {type: "TextArea", fieldAttrs: {'placeholder': ['code->#cdata-section', 'code->#text']}, template: scriptTemplate},
            "Engine": {type: 'Select', options: ["javascript", "groovy", "ruby", "python", "bash", "cmd", "R"], fieldAttrs: {'placeholder': 'code->@attributes->language', "data-help":"The runtime of the script."}},
            "Or Path": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->path'}},
            "Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'file->arguments->argument', 'itemplaceholder': '@attributes->value'}},
            "Or Url": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->url'}}
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
