(function ($) {
    var scriptTemplate = _.template(Template.get('script-form-template'));
    var serverScripts = function (callback) {
        callback([""].concat(StudioClient.listScripts()));
    }

    Script = SchemaModel.extend({
        schema: {
            "Library": {type: "Select", options: serverScripts},
            "Library Path": {type: "Hidden"},
            "Script": {type: "TextArea", fieldAttrs: {'placeholder': ['code->#cdata-section', 'code->#text']}, template: scriptTemplate},
            "Engine": {type: 'Select', options: ["javascript", "groovy", "ruby", "python"], fieldAttrs: {'placeholder': 'code->@attributes->language'}},
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
    });
})(jQuery);
