(function ($) {

    ScriptExecutableXmlView = Backbone.View.extend({
        render: function () {
            var script = this.model["Script"];
            if (typeof(this.model.get) != "undefined" && this.model.get("Script")) {
                script = this.model.get("Script").toJSON();
            }
            var scriptView = new TemplateView({model: script, template: "script-template"}).render().$el.text();
            var template = _.template(Template.get("script-executable-template"), {'script': scriptView});
            this.$el.text(template);
            return this;
        }
    });

})(jQuery)
