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
        initialize: function (options) {
            this.$el = $("<div id='catalog-browser-container'></div>");
            $("#catalog-browser-body").append(this.$el);
            // this.buckets.on('reset', this.render);
            // this.buckets.fetch();
            this.buckets = options.buckets;
            this.render();
        },
        render: function () {
            console.log("Full CatalogBucketCollection:");
            console.log(this.buckets);
            this.$el.html(this.template())
            return this;
        }
    })

})
