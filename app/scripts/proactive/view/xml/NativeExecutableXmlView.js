define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/native-executable-template.html',
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
            var script = undefined;
            if (model["Or Dynamic Command"]) {
                script = new TemplateView({model: model["Or Dynamic Command"], template: "script-template"}).render().$el.text();
                script = script.trim();
            }
            var template = _.template(tpl, {model: model, 'script': script});
            this.$el.text(template);
            return this;
        }
    })
})
