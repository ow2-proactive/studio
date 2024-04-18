define(
    [
        'underscore',
        'backbone',
        'proactive/config',
        'proactive/model/Workflow',
        'proactive/model/GroupByProjectMixin'
    ],

    function (_, Backbone, config, Workflow, GroupByProjectMixin) {

        "use strict";

        return Backbone.Collection.extend(
            _.extend({}, GroupByProjectMixin, {
                url: config.restApiUrl + '/workflows',
                model: Workflow,
                comparator: "name"
            }));
    })
