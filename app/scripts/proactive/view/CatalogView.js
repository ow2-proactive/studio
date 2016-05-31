define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/catalog-browser.html',
    ],

    function ($, Backbone, catalogBrowser) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function () {
            var that = this;
            this.$el = $("<div id='catalog-browser-container'></div>");
            $("#catalog-browser-body").append(this.$el);
            this.render();
        },
        render: function () {
            console.log(this.buckets);
            this.$el.html(this.template())
            return this;
        }
    })

})
