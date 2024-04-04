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
                // fix overlays of nested modal "third-party-credential-modal" inside "execute-workflow-modal" (backdrop overlays the previous modal)
                $(document).on('show.bs.modal', '.nested-modal', function () {
                    var zIndex = 1040 + (10 * $('.modal:visible').length);
                    $(this).css('z-index', zIndex);
                    // setTimeout is used because the .modal-backdrop isn't created when the event show.bs.modal is triggered.
                    setTimeout(function () {
                        $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
                    }, 0);
                });
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
                return {
                    'Name': $(document.getElementById('var-name')).val(),
                    'Value': $(document.getElementById('var-value')).val(),
                    'Description': $(document.getElementById('var-description')).val(),
                    'Model': $(document.getElementById('var-model')).val(),
                    'Group': $(document.getElementById('var-group')).val(),
                    'Advanced': $(document.getElementById('var-advanced')).is(":checked"),
                    'Hidden': $(document.getElementById('var-hidden')).is(":checked")
                }
            }
        })
    })