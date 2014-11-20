define(
    [
        'backbone',
        'text!proactive/templates/no-workflows-template.html'
    ],

    function (Backbone, noOpenWorkflowTemplate) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(noOpenWorkflowTemplate),
        initialize: function() {
            this.$el = $("<div></div>")
            $("#workflow-designer-outer").append(this.$el)
            this.render();
        },
        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

})
