(function ($) {

    TaskXmlView = Backbone.View.extend({
        render: function () {
            var executableType = this.model.get("Type");
            var executableView = new window[executableType + "XmlView"]({model: this.model.get("Parameters")});
            var executable = executableView.render().$el.text();

            var selectionScripts = [];
            if (this.model.get("Selection Scripts")) {
                $.each(this.model.get("Selection Scripts"), function (i, script) {
                    var view = new TemplateView({model: script, template: "script-template"}).render();
                    selectionScripts.push(view.$el.text());
                })
            }

            var preScript = new TemplateView({model: this.model.get("Pre Script"), template: "script-template"}).render().$el.text();
            var postScript = new TemplateView({model: this.model.get("Post Script"), template: "script-template"}).render().$el.text();
            var cleanScript = new TemplateView({model: this.model.get("Clean Script"), template: "script-template"}).render().$el.text();

            var that = this;
            if (this.model.controlFlow) {
                $.each(['if', 'loop', 'replicate'], function (i, control) {
                    if (that.model.controlFlow[control]) {
                        var controlModel = that.model.controlFlow[control].model;
                        if (controlModel && controlModel.get('Script')) {
                            that.model.controlFlow[control].script =
                                new TemplateView({model: controlModel.get('Script'), template: "script-template"}).render().$el.text();
                            return false;
                        }
                    }
                })
            }

            var taskTemplate = _.template(Template.get("task-template"),
                {'task': this.model.toJSON(),
                    'selectionScripts': selectionScripts,
                    'preScript': preScript.trim(),
                    'postScript': postScript.trim(),
                    'cleanScript': cleanScript.trim(),
                    'dependencies': this.model.dependencies,
                    'controlFlow': this.model.controlFlow,
                    'executable': executable});

            this.$el.text(taskTemplate);
            return this;
        }
    });

})(jQuery)
