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
                bucket_id: ""
            }
        });
    })
