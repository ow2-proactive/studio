define(
    [
        'underscore',
        'backbone',
        'proactive/config',
        'text!proactive/templates/workflow-variables-view-template.html',
        'proactive/view/ThirdPartyCredentialView',
        'proactive/view/FileBrowserView',
        'proactive/view/BeautifiedModalAdapter'
    ],
    function (_, Backbone, config, workflowVariablesTemplate, ThirdPartyCredentialView, FileBrowserView, BeautifiedModalAdapter) {

        "use strict";

        return Backbone.View.extend({

            template: _.template(workflowVariablesTemplate),

            model: {
                'jobModel': {},
                'jobVariables': {},
                'showAdvanced': false,
                'showHidden': false
            },

            events: {
                'click .var-edit-btn': 'openVariableEditorView',
                'click #add-variable-btn': 'addNewVariable',
                'click .var-globalfile-button': 'showGlobalFileModal',
                'click .var-userfile-button': 'showUserFileModal',
                'click .var-globalfolder-button': 'showGlobalFolderModal',
                'click .var-userfolder-button': 'showUserFolderModal',
                'click .var-catalogobject-button': 'showCatalogModal'
            },

            initialize: function () {
                this.$el = $('#workflow-variables-mode');
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

            render: function (jobInfos) {
                const wfIcon = jobInfos.jobModel.attributes["Generic Info"].find((info => info["Property Name"] === "workflow.icon"))
                if(wfIcon && (wfIcon["Property Value"].startsWith("/studio") || wfIcon["Property Value"].startsWith("/automation-dashboard")) ){
                    wfIcon["Property Value"] = config.prefixURL + wfIcon["Property Value"]
                }
                var jobInfosCloned = JSON.parse(JSON.stringify(jobInfos));
                this.model = $.extend(this.model, jobInfosCloned);
                this.$el.html(this.template(this.model));
                new BeautifiedModalAdapter().beautifyForm(this.$el);

                // Create a backup with the initial state of the workflow variables
                var studioApp = require('StudioApp');
                var backupVariables = this.model.jobModel.Variables ? JSON.parse(JSON.stringify(this.model.jobModel.Variables)) : [];
                if (!studioApp.models.jobModel.get("InitialVariables")) {
                    studioApp.models.jobModel.set({"InitialVariables": backupVariables});
                }
                return this;
            },

            updateVariableValue: function (jobVariables) {
                for (var key in jobVariables) {
                    this.model.jobVariables[key].Value = jobVariables[key];
                    var updatedVarElement = $(document.getElementById('wfv-'+key));
                    updatedVarElement.attr('value', _.escape(jobVariables[key]));
                }
            },

            updateVariables: function () {
                var that = this;
                if (!that.model.jobModel.Variables){
                    return []
                }
                that.model.jobModel.Variables.forEach(function (variable) {
                    var updatedVarElement = $(document.getElementById('wfv-'+variable.Name));
                    if (updatedVarElement.attr("data-variable-model") && updatedVarElement.attr("data-variable-model").toLowerCase() === "pa:boolean") {
                        variable.Value = updatedVarElement.find("input:checked").val();
                    } else {
                        variable.Value = updatedVarElement.val();
                    }
                });
                return this.model.jobModel.Variables;
            },

            showGlobalFileModal: function (event) {
                new FileBrowserView({
                    dataspace: "global",
                    varKey: event.target.getAttribute('value'),
                    selectFolder: false
                }).render();
            },

            showUserFileModal: function (event) {
                new FileBrowserView({
                    dataspace: "user",
                    varKey: event.target.getAttribute('value'),
                    selectFolder: false
                }).render();
            },

            showGlobalFolderModal: function (event) {
                new FileBrowserView({
                    dataspace: "global",
                    varKey: event.target.getAttribute('value'),
                    selectFolder: true
                }).render();
            },

            showUserFolderModal: function (event) {
                new FileBrowserView({
                    dataspace: "user",
                    varKey: event.target.getAttribute('value'),
                    selectFolder: true
                }).render();
            },

            showCatalogModal: function (event) {
                event.preventDefault();
                var studioApp = require('StudioApp');
                studioApp.views.catalogGetView.setKind("all", "Object");
                studioApp.views.catalogGetView.setVarKey(event.currentTarget.getAttribute('value'));
                // retrieve the filter of kind and contentType from variable model definition
                var model = event.currentTarget.previousElementSibling.dataset.variableModel;
                var matches = model.match(/\((.*)\)/); //matches[1] contains the value between the parentheses
                if (matches && matches.length > 1) {
                    var params = matches[1].split(',');
                    switch (params.length) {
                        case 1:
                            studioApp.views.catalogGetView.setFilter(params[0], undefined, undefined);
                            break;
                        case 2:
                            studioApp.views.catalogGetView.setFilter(params[0], params[1], undefined);
                            break;
                        case 3:
                            studioApp.views.catalogGetView.setFilter(params[0], params[1], params[2]);
                            break;
                        case 4:
                            studioApp.views.catalogGetView.setFilter(params[0], params[1], params[2]);
                            studioApp.views.catalogGetView.setObjectNameFilter(params[3]);
                            break;
                    }
                }
                studioApp.views.catalogGetView.render();

                var previousZIndex = $("#catalog-get-modal").css("z-index");
                studioApp.views.catalogGetView.setPreviousZIndex(previousZIndex);
                var zIndexModal = parseInt($("#catalog-get-modal").parents().find(".modal").css("z-index")); // #execute-workflow-modal
                $("#catalog-get-modal").css("z-index", (zIndexModal + 1).toString());
                $("#catalog-get-browse-button").hide();
                $('#catalog-get-modal').modal();
            },

            openVariableEditorView: function (event) {
                $('#variable-editor-modal').modal();
                var studioApp = require('StudioApp');
                if (!studioApp.isWorkflowOpen()) {
                    $('#select-workflow-modal').modal();
                    return;
                }
                var that = this;
                var selectedVariable = that.model.jobModel.Variables.find(function (variable) {
                    return variable.Name === event.target.getAttribute('value')
                })

                var updatedVarElement = $(document.getElementById('wfv-'+selectedVariable.Name));
                if (updatedVarElement.attr("data-variable-model").toLowerCase() === "pa:boolean") {
                    selectedVariable.Value = updatedVarElement.find("input:checked").val();
                } else {
                    selectedVariable.Value = updatedVarElement.val();
                }
                studioApp.views.variableEditorView.render({
                    'variable': selectedVariable,
                });
            },

            addNewVariable:function (){
                $('#variable-editor-modal').modal();
                var studioApp = require('StudioApp');
                if (!studioApp.isWorkflowOpen()) {
                    $('#select-workflow-modal').modal();
                    return;
                }
                var emptyVariable = {
                    Name: "",
                    Value: "",
                    Model: "",
                    Description: "",
                    Group: "",
                    Advanced: false,
                    Hidden: false,
            }
                studioApp.views.variableEditorView.render({
                    'variable': emptyVariable,
                });
            },

            getVisibleVariablesCount : function(group){
                for(var variable in this.model.jobVariables){
                    if(variable.Group === group){
                        if (!variable.Hidden && !variable.Advanced){
                            return true;
                        } else if (variable.Advanced && $('#wfv-advanced-checkbox').is(":checked")){
                            return true;
                        } else if (variable.Hidden && $('#wfv-hidden-checkbox').is(":checked")){
                            return true;
                        }
                    }
                }
                return false;
            },

            deleteVariable: function (variableName) {
                return this.updateVariables().filter(function (variable) {
                    return variable.Name !== variableName
                })
            }
        })
    })