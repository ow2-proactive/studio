(function ($) {

    NativeExecutableXmlView = Backbone.View.extend({
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
            var template = _.template(Template.get("native-executable-template"), {model: model, 'script': script});
            this.$el.text(template);
            return this;
        }
    });

})(jQuery)
