define(
    [
        'underscore',
        'backbone',
        'proactive/model/Workflow',
        'proactive/model/GroupByProjectMixin'
    ],

    function (_, Backbone, Workflow, GroupByProjectMixin) {

        "use strict";

        return Backbone.Collection.extend(
            _.extend({}, GroupByProjectMixin, {
                url: '/rest/studio/workflows',
                model: Workflow,
                comparator: "name"
            }));
    })
