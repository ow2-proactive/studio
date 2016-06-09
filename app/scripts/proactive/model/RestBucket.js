define(
    [
        'backbone',
        'proactive/model/CatalogWorkflowCollection'
    ],

    function (Backbone, CatalogWorkflowCollection) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                id: "",
                name: "",
                owner: "",
                created_at: "",
                workflows: ""
            },
            initialize: function(options) {
                var workflows = new CatalogWorkflowCollection({id: this.id});
                workflows.fetch();
                this.set("workflows", workflows);
                this.listenTo(workflows, 'add', this.forceRefreshView);
            },
            forceRefreshView: function () {
                require('StudioApp').views.catalogView.internalSwitchBucket(this.id);
            }
        });
    })
