define(
    [
        'jquery',
        'backbone',
        'vkbeautify',
        'proactive/view/xml/TaskXmlView',
        'text!proactive/templates/job-template.html',
        'text!proactive/templates/workflow-view-template.html',
        'codemirror',
        'codemirror/mode/xml/xml',
        'proactive/view/utils/escapeHtml'
    ],

    function ($, Backbone, beautify, TaskXmlView, JobTemplate, WorkflowTemplate, CodeMirror) {

    "use strict";

    return Backbone.View.extend({
        initialize: function () {
            var that = this;
            this.$el = $("<div id='workflow-xml-container'></div>");
            $("#workflow-xml-body").append(this.$el)

            $('#workflow-xml-tab').on('shown', function (e) {
                that.render();
            })
        },
        xml: function (jModel) {
            var that = this;
            var job = jModel.toJSON();

            var tasks = [];
            if (jModel.tasks) {
                $.each(jModel.tasks, function (i, task) {
                    var view = new TaskXmlView({model: task, jobView: that}).render();
                    tasks.push(view.$el.text());
                });
            }

            var jobRendering = _.template(JobTemplate, {'job': job, 'tasks': tasks, 'visualization': this.generateHtml()});

            // removing multiple \n before closing xml element tag
            jobRendering = jobRendering.replace(/\n+\s+>/g, '>\n');
            // indenting using vkbeautify
            return vkbeautify.xml(jobRendering.trim(), 2);
        },
        generateXml: function () {
            var that = this;
            return this.xml(this.model)
        },
        generateHtml: function () {
            var workflowDesigner = $("#workflow-designer").html();

            //There is no HTML to generate if no workflow is open
            if (workflowDesigner) {
                var width = $("#workflow-designer").get(0).scrollWidth;
                var height = $("#workflow-designer").get(0).scrollHeight;

                var minLeft = width;
                var minTop = height;
                $("#workflow-designer").find(".task").each(function () {
                    if ($(this).position().left < minLeft) {
                        minLeft = $(this).position().left;
                    }
                    if ($(this).position().top < minTop) {
                        minTop = $(this).position().top;
                    }
                })

                var top = (-1 * (minTop - 5)) + "px";
                var left = (-1 * (minLeft - 5)) + "px";

                var html = _.template(WorkflowTemplate,
                    {
                        'content': workflowDesigner,
                        'width': width, 'height': height, 'top': top, 'left': left
                    });

                return html;
            } else {
                return undefined;
            }
        },
        render: function () {
            // indenting using vkbeautify
            this.$el.empty()
            var codeDiv = $('<div class="code" id="workflow-xml">');
            this.generatedXml = vkbeautify.xml(this.generateXml(), 2)
            this.$el.append(codeDiv);

            var highlightedXml = CodeMirror(codeDiv[0], {
                value: this.generatedXml,
                mode: 'xml',
                lineNumbers: true,
                readOnly: true
            });

            $('#xml-view-modal').on('shown.bs.modal', function (e) {
                // need to explicitly call refresh when div is shown otherwise codemirror is not visible
                highlightedXml.refresh();
            })
            return this;
        }
    })

})
