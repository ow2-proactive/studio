/* global define */

define(
    [
        'backbone'
    ],

    function (Backbone) {

        'use strict';

        return Backbone.Router.extend({
            routes: {
                '' : 'gotoWorkflows',

                'workflows' : 'listWorkflows',
                'workflows/:id' : 'openWorkflow',
                'workflows/:id/' : 'openWorkflow',
                'workflows/:id/presets/:presetIndex' : 'openWorkflowWithTemplates',
                'workflows/:id/presets/' : 'openWorkflow',
                'presets/:presetIndex' : 'listWorkflowsWithTemplates',
                'workflowcatalog/:bucketName/workflow/:workflowName' : 'openCatalogWorkflow',
                '*others' : 'gotoWorkflows'
            },

            initialize: function(app) {
                this.app = app;

                Backbone.history.stop();
                Backbone.history.start();
            },
            gotoWorkflows: function() {
                this.navigate('workflows', {trigger: true});
            },

            listWorkflows: function() {
                this.app.views.propertiesView.listWorkflows();
                this.app.views.paletteView.render();
            },
            openWorkflow: function(id) {
                this.app.views.propertiesView.listWorkflows(id);
                this.app.views.paletteView.render();
            },
            openWorkflowWithTemplates: function(id, presetIndex) {
                this.app.views.propertiesView.listWorkflows(id);
                this.app.views.paletteView.render(presetIndex, true);
            },
            listWorkflowsWithTemplates: function(presetIndex) {
                this.app.views.propertiesView.listWorkflows();
                this.app.views.paletteView.render(presetIndex, true);
            },
            openCatalogWorkflow : function(bucketName, workflowName) {
                this.app.views.propertiesView.listWorkflows();
                this.app.views.paletteView.render();
                this.app.openWorkflowFromCatalog(bucketName, workflowName);
            }
        });
    });
