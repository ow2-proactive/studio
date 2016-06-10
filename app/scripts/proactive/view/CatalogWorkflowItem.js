define(
    [
        'jquery',
        'backbone',
        'xml2json',
        'text!proactive/templates/catalog-workflow.html',
        'proactive/view/CatalogView'
    ],

    function ($, Backbone, xml2json, catalogWorkflowList, CatalogView) {

        "use strict";

        return Backbone.View.extend({
            tagName: "li",
            events: {
                "click #btn-pull-workflow-xml": "pullWorkflow",
                "click #btn-remove-workflow": "removeConfirm",
		"click #btn-toggle-removal-state": "toggleRemovalState"
            },
            // Pull from the Catalog to the Studio
            pullWorkflow: function(e){
                e.preventDefault();
                var xmlContent = this.model.getXml();
                var StudioApp = require('StudioApp');
                $.when(xmlContent).done(function () {
                    if (!StudioApp.models.currentWorkflow) {
                        $('#select-workflow-modal').modal();
                        return;
                    }
                    else {
                        StudioApp.xmlToImport = xmlContent.responseText;
                        $('#import-workflow-confirmation-modal').modal();
                    }
                });
            },
            removeConfirm: function(){
                var StudioApp = require('StudioApp');
                StudioApp.workflowToRemove = this.model;
                $('#delete-workflow-confirmation-modal').modal();

                // get the current el into a local var
                var elToModify = this.$el;

                console.log('elToModify');
                console.log(elToModify);

                // replace in the local var
                console.log('toggling removal state !');
                if ($('#btn-toggle-removal-state input', elToModify).prop('checked')) {
                    $('#btn-toggle-removal-state input', elToModify).prop('checked', false);
                    console.log('element to uncheck:');
                    console.log($('#btn-toggle-removal-state i', elToModify));
                    $('#btn-toggle-removal-state i', elToModify)
                        .removeClass()
                        .addClass('state-icon glyphicon glyphicon-unchecked');
                    console.log('element after modification:');
                    console.log($('#btn-toggle-removal-state i', elToModify));

                }
                else {
                    $('#btn-toggle-removal-state input', elToModify).prop('checked', true);
                    console.log('element to check:');
                    console.log($('#btn-toggle-removal-state i', elToModify));
                    $('#btn-toggle-removal-state i', elToModify)
                        .removeClass()
                        .addClass('state-icon glyphicon glyphicon-check');
                    console.log('element after modification:');
                    console.log($('#btn-toggle-removal-state i', elToModify));
                }

                // replace the dom el by this local var, replace this.el with local var
                console.log('new state:');
                console.log($('#btn-toggle-removal-state input', elToModify).prop('checked'));
                this.$el.replaceWith(elToModify);
                this.setElement(elToModify);
            },
            removeWorkflow: function(event) {

            },
            render: function () {
                var workflowList = _.template(catalogWorkflowList);
                $(this.el).html(workflowList({ workflow: this.model }));
                return this;
            }
        })
    })
