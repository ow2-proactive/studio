(function ($) {

    PaletteView = Backbone.View.extend({
        initialize: function () {
            this.render();
        },
        render: function () {
            var taskWidget = $(
                '<span class="label draggable ui-draggable job-element" title="Computational task">' +
                    '<img src="images/gears.png" width="40px">Task</span>');

            var ifWidget = $(
                '<span class="label draggable ui-draggable job-element control-flow control-flow-if" title="If Control">' +
                    '<img src="images/gears.png" width="20px">If</span>');

            var loopWidget = $(
                '<span class="label draggable ui-draggable job-element control-flow control-flow-loop" title="Loop Control">' +
                    '<img src="images/gears.png" width="20px">Loop</span>');

            var replicateWidget = $(
                '<span class="label draggable ui-draggable  job-element control-flow control-flow-replicate" title="Replicate Control">' +
                    '<img src="images/gears.png" width="20px">Replicate</span>');

            this.$el.append(taskWidget).append(replicateWidget).append(ifWidget).append(loopWidget);

            $(".draggable").draggable({helper: "clone"});
        }
    });

})(jQuery)
