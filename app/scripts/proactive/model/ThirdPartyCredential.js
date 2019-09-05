define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                key: "",
                value: ""
            },
            getKey: function () {
                try {
                    return this.get('key');
                } catch (e) {
                    return "";
                }
            },
            getValue: function () {
                try {
                    return this.get('value');
                } catch (e) {
                    return "";
                }
            }
        });
    })
