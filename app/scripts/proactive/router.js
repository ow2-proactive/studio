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
                'workflows/:id/templates/:bucketName' : 'openWorkflowWithTemplates',

                'templates' : 'listTemplates',
                'templates/:id' : 'openTemplate'
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
                this.app.setTemplateBucket();
            },
            openWorkflow: function(id) {
                this.app.views.propertiesView.listWorkflows(id);
                this.app.setTemplateBucket();
            },
            openWorkflowWithTemplates: function(id, bucketName) {
                this.app.views.propertiesView.listWorkflows(id);
                this.app.setTemplateBucket(bucketName);
            },
            listTemplates: function() {
                this.app.views.propertiesView.listTemplates();
                this.app.setTemplateBucket();
            },
            openTemplate: function(id) {
                this.app.views.propertiesView.listTemplates(id);
                this.app.setTemplateBucket();
            }
        });
    });
