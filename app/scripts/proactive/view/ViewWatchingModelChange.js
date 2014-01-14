define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.View.extend({
        initialize: function () {
            this.model.on("change", this.render, this);
            this.render();
        }
    })

})