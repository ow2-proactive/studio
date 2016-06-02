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
                created_at: ""
            },
            initialize: function(options) {
                var workflows = new CatalogWorkflowCollection({id: this.id});
                workflows.fetch();
                this.set("workflows", workflows);
            }
        });
    })
