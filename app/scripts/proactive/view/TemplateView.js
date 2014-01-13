(function ($) {

    TemplateView = Backbone.View.extend({
        render: function () {
            if (this.model) {

                if (typeof(this.model.toJSON) != "undefined" && this.model) {
                    this.model = this.model.toJSON();
                }

                var template = _.template(Template.get(this.options.template), {'model': this.model});
                this.$el.text(template);
            }
            return this;
        }
    });

})(jQuery)
