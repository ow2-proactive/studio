define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/script-template.html',
        'text!proactive/templates/selection-script-template.html',
        'text!proactive/templates/script-code-template.html',
        'text!proactive/templates/script-file-template.html'

    ],

    function ($, Backbone) {

        "use strict";

        return Backbone.View.extend({
        render: function () {
            if (this.model) {

                if (typeof(this.model.toJSON) != "undefined" && this.model) {
                    this.model = this.model.toJSON();
                }

                var tpl = require('text!proactive/templates/'+this.options.template+'.html')
                var template = _.template(tpl, {'model': this.model});
                this.$el.text(template);
            }
            return this;
        }
    })

})
