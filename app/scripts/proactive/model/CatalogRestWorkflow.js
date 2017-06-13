define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                id: "",
                name: "",
                key_value_metadata: [],
                created_at: "",
                revision_id: "",
                bucket_id: "",
                layout: ""
            }
        });
    })
