define(
    [
        'backbone',
        'proactive/model/CatalogWorkflowCollection'
    ],

    function (Backbone, CatalogWorkflowCollection) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                name: "",
                owner: "",
                created_at: "",
                catalogObjects: ""
            }
        });
    })
