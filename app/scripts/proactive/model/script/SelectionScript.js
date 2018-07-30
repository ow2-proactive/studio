define(
    [
        'backbone',
        'underscore',
        'proactive/model/SchemaModel',
        'proactive/model/script/Script',
        'proactive/config',
        'text!proactive/templates/selection-script-code-form-template.html',
        'proactive/model/utils'
    ],

    function (Backbone, _, SchemaModel, Script, config, tpl, utils) {

    "use strict";

    var dataHelp = "A selection script written in Groovy, Ruby, Python and other languages supported by the JSR-223. It must define the boolean binding <u>selected</u> to select the node.";

    var scriptCodeTemplate = _.template(tpl);

    // class for most fields in the modal form
    var fullWidthClass = 'full-width';
    // class for arguments
    var argumentsModalClass = 'arguments-modal';

    var originalModel = Script("Script/selection", null, null, dataHelp, scriptCodeTemplate, fullWidthClass, fullWidthClass, argumentsModalClass);

    return originalModel.extend({
        schema: SchemaModel.prototype.mergeObjectsPreserveOrder(
            originalModel.prototype.schema,
            {
                "Type": {
                    type: 'Select',
                    options: ["dynamic", "static"],
                    validators: ['required'],
                    fieldAttrs: {
                        'placeholder': 'script->@attributes->type',
                        'data-help' : 'Based on the selection script code definition (md5), a <i>static</i> script is run only once on a given node. A <i>dynamic</i> script will be re-run.'
                    }
                }
            }),
        defaults : {
            "ScriptType": "ScriptCode"
        }
    });
})
