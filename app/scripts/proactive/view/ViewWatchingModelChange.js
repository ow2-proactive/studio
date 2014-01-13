(function ($) {

    ViewWatchingModelChange = Backbone.View.extend({
        initialize: function () {
            this.model.on("change", this.render, this);
            this.render();
        }
    });

})(jQuery)