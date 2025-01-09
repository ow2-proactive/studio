define(
    [
        'underscore',
        'backbone',
    ],

    function (_, Backbone) {

        "use strict";

        var defaultProjectName = 'Default';

        function sortDefaultFirst(groups, option) {
            var keys = _.keys(groups);
            var values = _.values(groups);
            if (option === undefined || option == "A-Z") {
                keys = sortProjectsAsc(keys);
            } else if (option == "Z-A") {
                keys = sortProjectsDesc(keys);
            } else if (option == "Newer edit") {
                keys = sortProjectsByNewerEdit(keys, values);
            } else if (option == "Older edit") {
                keys = sortProjectsByOlderEdit(keys, values);
            }
            return keys;
        }

       function sortProjectsAsc(keys) {
            keys.sort();
            if (_.indexOf(keys, defaultProjectName) != -1) {
                keys = _.without(keys, defaultProjectName);
                keys.unshift(defaultProjectName);
            }
            return keys;
       }

       function sortProjectsDesc(keys) {
            keys.sort().reverse();
            if (_.indexOf(keys, defaultProjectName) != -1) {
                keys = _.without(keys, defaultProjectName);
                keys.push(defaultProjectName);
            }
            return keys;
       }

       function sortProjectsByNewerEdit(keys, values) {
            var index1, index2, model1Date, model2Date;
            keys.sort(function(model1, model2) {
                index1 = getIndexOfWorkflow(keys, model1);
                index2 = getIndexOfWorkflow(keys, model2);
                model1Date = getModifyDateOfProject(values, index1, "Newer edit");
                model2Date = getModifyDateOfProject(values, index2, "Newer edit");
                return model2Date - model1Date;
            });
            return keys;
       }

       function sortProjectsByOlderEdit(keys, values) {
             var index1, index2, model1Date, model2Date;
            keys.sort(function(model1, model2) {
                index1 = getIndexOfWorkflow(keys, model1);
                index2 = getIndexOfWorkflow(keys, model2);
                model1Date = getModifyDateOfProject(values, index1, "Older edit");
                model2Date = getModifyDateOfProject(values, index2, "Older edit");
                return model1Date - model2Date;
            });
            return keys;
       }

       function getIndexOfWorkflow(keys, key) {
            var index =0;
            for (var i = 1; i < keys.length; i ++) {
                if (keys[i] === key) {
                    index = i;
                }
            }
            return index;
       }

        function getModifyDateOfProject(values, i, option) {
            var modifyDate = values[i][0].attributes.modifyDate;
            for (var j = 0; j < values[i].length; j ++) {
                var anotherDate = values[i][j].attributes.modifyDate;
                if (option == "Newer edit" && modifyDate < anotherDate) {
                    modifyDate = anotherDate;
                }
                if (option == "Older edit" && modifyDate > anotherDate) {
                    modifyDate = anotherDate;
                }
            }
            return modifyDate;
        }

        function applyFunctionToEachGroup(f, projects, groups) {
            _.each(projects, function (project) {
                f(project, groups[project]);
            });
        }

        return {
            _groupByProject: function (option, searchWorkflow) {
               this.filterWorkflowsByName(searchWorkflow);
               this.sortWorkflows(option);
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
            filterWorkflowsByName: function (searchWorkflow) {
                this.allModels = this.models;
                if (searchWorkflow !== undefined && searchWorkflow !== "") {
                    this.models = this.allModels.filter(item => (item.attributes.name.toLowerCase().includes(searchWorkflow.toLowerCase())));
                }
            },
            sortWorkflows: function (option) {
               if (option === "A-Z") {
                    this.sortWorkflowsAsc();
               } else if (option === "Z-A") {
                    this.sortWorkflowsDesc();
               } else if (option === "Newer edit") {
                    this.sortWorkflowsByNewerEdit();
               } else if (option === "Older edit") {
                    this.sortWorkflowsByOlderEdit();
               }
            },
            sortWorkflowsAsc: function () {
                this.comparator = function(model1, model2) {
                    var name1 = model1.getName();
                    if(name1 === undefined) {
                        name1 = model1.attributes.name;
                    }
                    var name2 = model2.getName();
                    if(name2 === undefined) {
                        name2 = model2.attributes.name;
                    }
                    return name1.localeCompare(name2);
                };
                this.sort();
            },
            sortWorkflowsDesc: function () {
                this.comparator = function(model1, model2) {
                    var name1 = model1.getName();
                    if(name1 === undefined) {
                        name1 = model1.attributes.name;
                    }
                    var name2 = model2.getName();
                    if(name2 === undefined) {
                        name2 = model2.attributes.name;
                    }
                    return name2.localeCompare(name1);
                };
                this.sort();
            },
            sortWorkflowsByNewerEdit: function () {
                this.comparator = function(model1, model2) {
                    var date1 = model1.attributes.modifyDate;
                    var date2 = model2.attributes.modifyDate;
                    return date2 - date1;
                };
                this.sort();
            },
            sortWorkflowsByOlderEdit: function () {
                this.comparator = function(model1, model2) {
                    var date1 = model1.attributes.modifyDate;
                    var date2 = model2.attributes.modifyDate;
                    return date1 - date2;
                };
                this.sort();
            },
            groupByProject: function (f, option, searchWorkflow) {
                var groups = this._groupByProject(option, searchWorkflow);
                var projects = sortDefaultFirst(groups, option);
                applyFunctionToEachGroup(f, projects, groups);
                this.models = this.allModels;
            }
        };
    });
