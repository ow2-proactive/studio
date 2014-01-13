(function ($) {
    NativeExecutable = SchemaModel.extend({
        schema: {
            "Static Command": {type: "Text", fieldAttrs: {'placeholder': 'staticCommand->@attributes->value'}},
            "Working Folder": {type: "Text", fieldAttrs: {'placeholder': 'staticCommand->@attributes->workingDir'}},
            "Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'staticCommand->arguments->argument', 'itemplaceholder': '@attributes->value'}},
            "Or Dynamic Command": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'dynamicCommand->generation->script'}},
            "Working Dir": {type: "Text", fieldAttrs: {'placeholder': 'dynamicCommand->@attributes->workingDir'}}
        }
    });
})(jQuery);
