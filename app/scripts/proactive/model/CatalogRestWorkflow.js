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
            },
            getXml: function() {
                return $.ajax({
                    url: this.collection.url() + '/' + this.id + '/raw'
                }).done(function (response) {
                    return new XMLSerializer().serializeToString(response);
                });
            }
        });
    })
