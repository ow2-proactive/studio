define(
    [
        'underscore',
        'backbone',
        'text!proactive/templates/variable-editor-view-template.html',
        'proactive/view/BeautifiedModalAdapter'
    ],
    function (_, Backbone, variableEditorTemplate, BeautifiedModalAdapter) {

        "use strict";

        return Backbone.View.extend({

            template: _.template(variableEditorTemplate),

            model: {
                'variable': {}
            },

            events: {
                'click .var-globalfile-button': 'showGlobalFileModal'
            },

            initialize: function () {
                this.$el = $('#var-edit');
            },

            render: function (varInfo) {
                var varInfoCloned = JSON.parse(JSON.stringify(varInfo));
                this.model = $.extend(this.model, varInfoCloned);
                this.$el.html(this.template(this.model));
                new BeautifiedModalAdapter().beautifyForm(this.$el);
                return this;
            },

            originalName: function () {
                return $(document.getElementById('var-name')).attr('data-original')
            },

            updateVariable: function () {
                var updatedVar = {
                    'Name': $(document.getElementById('var-name')).val().trim(),
                    'Value': $(document.getElementById('var-value')).val(),
                    'Description': $(document.getElementById('var-description')).val(),
                    'Model': $(document.getElementById('Model')).val(),
                    'Group': $(document.getElementById('var-group')).val().trim(),
                    'Advanced': $(document.getElementById('var-advanced')).is(":checked"),
                    'Hidden': $(document.getElementById('var-hidden')).is(":checked")
                }
                // Delete null & empty properties
                for (var propName in updatedVar) {
                    if (updatedVar[propName] === null || updatedVar[propName] === undefined || updatedVar[propName]==='')  {
                        delete updatedVar[propName];
                    }
                }
                return updatedVar
            }
        })
    })