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
                variables: [],
                generic_information: [],
                created_at: "",
                revision_id: "",
                bucket_id: "",
                project_name: "",
                layout: ""
            }
        });
    })
