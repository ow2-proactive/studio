define(
    [
        'underscore',
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

    function (_, $, Backbone, beautify, TaskXmlView, JobTemplate, WorkflowTemplate, CodeMirror) {

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

            var jobRendering = _.template(JobTemplate)({'job': job, 'tasks': tasks, 'visualization': this.generateHtml()});

            // removing multiple \n before closing xml element tag
            jobRendering = jobRendering.replace(/\n+\s+>/g, '>\n');
            // indenting using vkbeautify
            return this.beautifyAndPreserveCDATA(jobRendering.trim(), 2);
        },
        // pretty-print xml and preserve CDATA sections from indentation changes
        beautifyAndPreserveCDATA: function(text, beautifyDepth) {
            var that = this;
            var cdataStartString = '<![CDATA['
            var cdataEndString = ']]>'
            // array storing all unmodified cdata sections
            var cdataSections = []
            var toParse = text
            var accumulated = ""
            var cdataStart = toParse.indexOf(cdataStartString)
            var cdataEnd = toParse.indexOf(cdataEndString) + cdataEndString.length
            var cdataIndex = 0;

            // replace all cdata sections with <![CDATA[index]]> store the content extracted inside the cdataSections array
            while (cdataStart > 0 && cdataEnd > 0) {
                var begin = toParse.substring(0, cdataStart)
                var middle = toParse.substring(cdataStart, cdataEnd)
                var end = toParse.substring(cdataEnd)
                var replacement = cdataStartString + cdataIndex + cdataEndString
                accumulated += begin + replacement
                toParse = end
                cdataSections.push(middle)
                var cdataStart = toParse.indexOf(cdataStartString)
                var cdataEnd = toParse.indexOf(cdataEndString) + cdataEndString.length
                cdataIndex++
            }
            accumulated += toParse
            // pretty-print using vkbeautify, 'accumulated' variable contains xml with <![CDATA[index]]> patterns
            var beautifiedXml = vkbeautify.xml(accumulated, beautifyDepth)

            // function used instead of replace to avoid special patterns in replacement strings
            function replaceSplitJoin(string, search, replace) {
                return string.split(search).join(replace);
            }

            // after pretty-print is done, replace back the original CDATA sections
            for (var i = 0; i < cdataSections.length; i++) {
                beautifiedXml = replaceSplitJoin(beautifiedXml, cdataStartString + i + cdataEndString, cdataSections[i])
            }
            return beautifiedXml
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

                var html = _.template(WorkflowTemplate)
                    ({
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
            this.generatedXml = this.generateXml()
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
