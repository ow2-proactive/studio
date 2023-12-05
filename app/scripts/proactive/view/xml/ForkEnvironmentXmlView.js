define(
    [
        'underscore',
        'jquery',
        'backbone',
        'text!proactive/templates/fork-environment-template.html',
        'proactive/view/TemplateView'
    ],

    function (_, $, Backbone, tpl, TemplateView) {

        "use strict";

        return Backbone.View.extend({
            render: function () {
                var model = this.model;
                if (typeof(this.model.toJSON) != "undefined") {
                    model = this.model.toJSON();
                }
                var script = undefined;
                if (model["Environment Script"]) {
                    script = new TemplateView({
                        model: model["Environment Script"],
                        template: "script-template"
                    }).render().$el.text();
                    script = script.trim();
                }

                var isForkEnvironmentDefined =
                    (model["Java Home"] && model["Java Home"].length > 0) ||
                    (model["Working Folder"] && model["Working Folder"].length > 0) ||
                    (model["Environment Variables"] && model["Environment Variables"].length > 0) ||
                    (model["Jvm Arguments"] && model["Jvm Arguments"].length > 0) ||
                    (model["Additional Classpath"] && model["Additional Classpath"].length > 0) ||
                    (script && script.length > 0);

                var template = _.template(tpl)({
                    model: model,
                    'script': script,
                    'isForkEnvironmentDefined': isForkEnvironmentDefined
                });
                this.$el.text(template);
                return this;
            }
        })

    })
