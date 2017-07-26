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
            	var that = this;
                var workflows = new CatalogWorkflowCollection({
                	id: this.id,
                	callback: function(data){
                		that.set("workflows", data);
                	}});
                workflows.fetch();
            }
        });
    })
