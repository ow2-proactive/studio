define(
    [
        'require',
        'jquery',
        'backbone',
        'text!proactive/templates/task-template.html',
        'proactive/view/TemplateView',
        'proactive/view/xml/JavaExecutableXmlView',
        'proactive/view/xml/NativeExecutableXmlView',
        'proactive/view/xml/ScriptExecutableXmlView',
        'proactive/view/xml/ForkEnvironmentXmlView'

    ],
    function (require, $, Backbone, TaskTemplate, TemplateView) {

    "use strict";

    return Backbone.View.extend({
        render: function () {
            var executableType = this.model.get("Type");
            var executableViewType = require('proactive/view/xml/' + executableType + "XmlView");
            var executableView = new executableViewType({model: this.model.get(executableType)});
            var executable = executableView.render().$el.text();

            var forkEnvironmentViewType = require('proactive/view/xml/ForkEnvironmentXmlView');
            var forkEnvironmentView = new forkEnvironmentViewType({model: this.model.get("Fork Environment")});
            var forkEnvironment = forkEnvironmentView.render().$el.text();

            var selectionScripts = [];
            if (this.model.get("Node Selection")) {
                $.each(this.model.get("Node Selection"), function (i, script) {
                    var view = new TemplateView({model: script, template: "selection-script-template"}).render();
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
                        if (controlModel) {
                            that.model.controlFlow[control].script =
                                new TemplateView({model: controlModel, template: "script-template"}).render().$el.text();
                            return false;
                        }
                    }
                })
            }

            var taskTemplate = _.template(TaskTemplate,
                {'task': this.model.toJSON(),
                    'selectionScripts': selectionScripts,
                    'preScript': preScript.trim(),
                    'postScript': postScript.trim(),
                    'cleanScript': cleanScript.trim(),
                    'dependencies': this.model.dependencies,
                    'controlFlow': this.model.controlFlow,
                    'executable': executable,
                    'forkEnvironment': forkEnvironment
                });

            this.$el.text(taskTemplate);
            return this;
        }
    })

})
