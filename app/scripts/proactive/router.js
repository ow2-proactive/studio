define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Router.extend({
            routes: {
                "" : "gotoWorkflows",

                "workflows" : "listWorkflows",
                "workflows/:id" : "openWorkflow",

                "templates" : "listTemplates",
                "templates/:id" : "openTemplate"
            },

            initialize: function(app) {
                this.app = app;

                Backbone.history.stop()
                Backbone.history.start()
            },
            gotoWorkflows: function() {
                this.navigate("workflows", {trigger: true})
            },

            listWorkflows: function(id) {
                this.app.views.propertiesView.listWorkflows();
            },
            openWorkflow: function(id) {
                this.app.views.propertiesView.listWorkflows(id);
            },

            listTemplates: function() {
                this.app.views.propertiesView.listTemplates();
            },
            openTemplate: function(id) {
                this.app.views.propertiesView.listTemplates(id)
            }
        })
    })
