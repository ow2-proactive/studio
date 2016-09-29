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
            this.$el = $("<div></div>")
            $("#palette-container").append(this.$el)

            this.options.templates.on('add', this.render, this);
            this.options.templates.on('remove', this.render, this);
            this.options.templates.on('reset', this.render, this);
            this.options.templates.fetch();
            this.render();
        },
        createMenuFromConfig: function (template, menu) {
            var that = this;

            for (var property in template) {
                if (template.hasOwnProperty(property)) {
                    if (typeof template[property] == "object") {
                        var header = $('<li role="presentation" class="dropdown-header">'+property+'</li>');
                        menu.append(header);

                        this.createMenuFromConfig(template[property], menu);
                    } else {
                    	var iconName = property.replace(/\s+/g, '');
                        var subMenu = $('<li id="'+property+'" class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me"><a class="" href="#" onclick="return false;"><img src="images/'+iconName+'.png"  style="width:20px;height:20px;">&nbsp;&nbsp;'+property+' </a></li>');
                        subMenu.tooltip();
                        menu.append(subMenu);
                        subMenu.data("templateName", property);
                        subMenu.data("templateUrl", template[property]);
                        subMenu.draggable({helper: "clone", scroll: true})

                        subMenu.click(function(event) {
                            // simulating drag and drop of this element
                            var workflowView = that.options.app.views.workflowView
                            workflowView.dropElement(event, {draggable:this, offset: {left: event.pageX, top: event.pageY}})
                        })
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
            this.$el.html('');
            var that = this;
            var taskWidget = $(
                '<span class="dropdown"><span id="task-menu" class="label job-element job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="30px" type="button" >Tasks <span class="caret"></span></span></span>');

            this.initMenu($(taskWidget), config.tasks);

            var manualWidget = $(
                '<span class="dropdown"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Manuals <span class="caret"></span></span></span>');

            this.initMenu($(manualWidget), config.manuals);

            var controlWidget = $(
                '<span class="dropdown"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Controls <span class="caret"></span></span></span>');

            this.initMenu($(controlWidget), config.controls);

            var templateWidget = $(
                '<span class="dropdown"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Templates <span class="caret"></span></span></span>');

            var menuContent = $('<ul class="dropdown-menu templates-menu" role="menu" aria-labelledby="dropdown-templates-menu"></ul>');

            $(templateWidget).append(menuContent)

            this.options.templates.groupByProject(function (project, templates) {
                var header = $('<li role="presentation" class="dropdown-header">'+project+'</li>');
                menuContent.append(header);
                _.each(templates, function(template) {
                    if (template.get("name")) {
                        var menuItem = $('<li class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me"><a class="" href="#" onclick="return false;">' + template.get("name") + '</a></li>');
                        menuItem.tooltip();
                        menuContent.append(menuItem);
                        menuItem.data("templateName", template.get("name"));
                        menuItem.data("templateId", template.get("id"));
                        menuItem.draggable({helper: "clone", scroll: true});

                        menuItem.click(function(event) {
                            // simulating drag and drop of this element
                            var workflowView = that.options.app.views.workflowView
                            workflowView.dropElement(event, {draggable:this, offset: {left: event.pageX, top: event.pageY}})
                        })
                    }
                })
            }, this);

            $(templateWidget).find(".dropdown-toggle").dropdown();

            this.$el.append(taskWidget).append(manualWidget).append(controlWidget).append(templateWidget);
        }
    })

})
