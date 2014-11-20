define(
    [
        'backbone',
        'proactive/model/Workflow',
        'proactive/model/GroupByProjectMixin'
    ],

    function (Backbone, Workflow, GroupByProjectMixin) {

        "use strict";

        return Backbone.Collection.extend(
            _.extend({}, GroupByProjectMixin, {
                url: '/rest/studio/templates',
                model: Workflow,
                comparator: "name"
            })
        );
    });
