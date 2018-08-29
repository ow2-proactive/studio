define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                name: "",
                bucket_name: ""
            }
        });
    })
