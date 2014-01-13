(function ($) {
    ScriptExecutable = SchemaModel.extend({
        schema: {
            "Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'script'}}
        }
    });
})(jQuery);
