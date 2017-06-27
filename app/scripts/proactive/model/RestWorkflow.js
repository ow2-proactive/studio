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
            },
            getXml: function() {
                return $.ajax({
                    url: this.collection.urlWithoutSize() + '/' + this.id + '?alt=xml'
                }).done(function (response) {
                    return new XMLSerializer().serializeToString(response);
                });
            }
        });
    })
