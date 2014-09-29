define(
    [
        'jquery',
        'backbone',
        'proactive/config'
    ],

    function ($, Backbone, config) {

        "use strict";

        return Backbone.View.extend({

        initialize: function () {
            this.render();
        },
        createMenuFromConfig: function (template, menu) {
            for (var property in template) {
                if (template.hasOwnProperty(property)) {
                    if (typeof template[property] == "object") {
                        var header = $('<li role="presentation" class="dropdown-header">'+property+'</li>');
                        menu.append(header);

                        this.createMenuFromConfig(template[property], menu);
                    } else {
                        var subMenu = $('<li class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me"><a class="" href="#">'+property+'</a></li>');
                        subMenu.tooltip();
                        menu.append(subMenu);
                        subMenu.data("templateName", property);
                        subMenu.data("templateUrl", template[property]);
                    }
                }
            }
        },
        initMenu: function(menu, config) {

            var menuContent = $('<ul class="dropdown-menu templates-menu" role="menu" aria-labelledby="dropdown-templates-menu"></ul>');

            this.createMenuFromConfig(config, menuContent);
            menu.append(menuContent)
            menu.find(".dropdown-toggle").dropdown();
        },
        render: function () {
            var taskWidget = $(
                '<span class="dropdown"><span class="label job-element job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="30px" type="button" >Task <span class="caret"></span></span></span>');

            this.initMenu($(taskWidget), config.tasks);

            var controlWidget = $(
                '<span class="dropdown"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Controls <span class="caret"></span></span></span>');

            this.initMenu($(controlWidget), config.controls);

            var templateWidget = $(
                '<span class="dropdown"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Templates <span class="caret"></span></span></span>');
            this.initMenu($(templateWidget), config.templates);

            this.$el.append(taskWidget).append(controlWidget).append(templateWidget);
        }
    })

})
