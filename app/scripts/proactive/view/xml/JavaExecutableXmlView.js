define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/java-executable-template.html',
        'proactive/view/TemplateView'
    ],

    function ($, Backbone, tpl, TemplateView) {

        "use strict";

        return Backbone.View.extend({
        render: function () {
            var model = this.model;
            if (typeof(this.model.toJSON) != "undefined") {
                model = this.model.toJSON();
            }
            var template = _.template(tpl, {model: model});
            this.$el.text(template);
            return this;
        }
    })

})
