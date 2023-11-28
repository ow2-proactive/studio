define(
    [
        'underscore',
        'backbone',
    ],

    function (_, Backbone) {

        "use strict";

        var defaultProjectName = 'Default';

        function sortDefaultFirst(keys) {
            keys.sort();
            if (_.indexOf(keys, defaultProjectName) != -1) {
                keys = _.without(keys, defaultProjectName);
                keys.unshift(defaultProjectName);
            }
            return keys;
        }

        function applyFunctionToEachGroup(f, projects, groups) {
            _.each(projects, function (project) {
                f(project, groups[project]);
            });
        }

        return {
            _groupByProject: function () {
                var groups = this.groupBy(function (workflow) {
                        var project = workflow.getProject();
                        if (project === undefined || project === null || project.trim() === '') {
                            project = defaultProjectName;
                        }
                        return project;
                    }
                );
                return groups;
            },
            groupByProject: function (f) {
                var groups = this._groupByProject();
                var projects = sortDefaultFirst(_.keys(groups));
                applyFunctionToEachGroup(f, projects, groups);
            }
        };
    });
