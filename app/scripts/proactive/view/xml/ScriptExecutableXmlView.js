define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/script-executable-template.html',
        'proactive/view/TemplateView'
    ],

    function ($, Backbone, tpl, TemplateView) {

        "use strict";

        return Backbone.View.extend({
        render: function () {
            var scriptView = new TemplateView({model: this.model, template: "script-template"}).render().$el.text();
            var template = _.template(tpl, {'script': scriptView});
            this.$el.text(template);
            return this;
        }
    })

})
